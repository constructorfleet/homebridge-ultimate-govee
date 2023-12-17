import { iot, mqtt } from 'aws-iot-device-sdk-v2';
import { GoveeClient } from './GoveeClient';
import { GOVEE_CLIENT_ID, IOT_CA_CERTIFICATE } from '../../util/const';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { IoTConnectionStateEvent, IoTErrorEvent, IoTEventData, IoTInitializeClientData } from '../../core/events/dataClients/iot/IoTEvent';
import { ConnectionState } from '../../core/events/dataClients/DataClientEvent';
import { IotReceive } from '../../core/events/dataClients/iot/IotReceive';
import { IoTSubscribedToEvent, IoTSubscribeToEvent } from '../../core/events/dataClients/iot/IotSubscription';
import { IoTUnsubscribedFromEvent } from '../../core/events/dataClients/iot/IotRemoveSubscription';
import { LoggingService } from '../../logging/LoggingService';
import { Lock } from 'async-await-mutex-lock';
import { promisify } from 'util';
import { QOS } from 'aws-iot-device-sdk-v2/dist/greengrasscoreipc/model';

@Injectable()
export class IoTClient
  extends GoveeClient {
  private client?: mqtt.MqttClient = undefined;
  private config?: mqtt.MqttConnectionConfig = undefined;
  private connection?: mqtt.MqttClientConnection = undefined;
  private connected = false;
  private lock = new Lock<void>();
  private readonly subscriptions: Set<string> = new Set<string>();

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(IOT_CA_CERTIFICATE) private readonly caPath: string,
    @Inject(GOVEE_CLIENT_ID) private readonly clientId: string,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'IOT.Initialize', {
    async: true,
    nextTick: true,
  },
  )
  public async setup(data: IoTInitializeClientData) {
    if (!this.client || !this.config) {
      this.config = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder(
        data.certificate.toString(),
        data.privateKey.toString()
      ).with_certificate_authority_from_path(this.caPath)
        .with_client_id(`AP/${ data.accountId }/a${ this.clientId }`)
        .with_endpoint(data.endpoint)
        .with_clean_session(false)
        .build();

      this.client = new mqtt.MqttClient();
    }
    this.connection = this.client.new_connection(this.config!);

    try {
      await this.connection.connect();
    } catch (error) {
      this.log.error(error);
      return;
    }

    this.connection.on(
      'connect',
      async () => {
        if (!this.connected) {
          this.log.info(
            'IoTClient',
            'onConnect',
            'Connection Connected',
          );
          this.connected = true;
          await this.emitAsync(
            new IoTConnectionStateEvent(ConnectionState.Connected),
          );
          await this.resubscribe();
        }
      },
    );

    this.connection.on(
      'resume',
      async () => {
        this.log.info(
          'IoTClient',
          'onReconnect',
          'Connection Reconnected',
        );
        if (!this.connected) {
          this.connected = true;
          await this.emitAsync(
            new IoTConnectionStateEvent(ConnectionState.Connected),
          );
          await this.resubscribe();
        }
      },
    );

    this.connection.on(
      'message',
      async (topic: string, payload: ArrayBuffer, dup: boolean, qos: mqtt.QoS, retain: boolean) => {
        await this.emitAsync(
          new IotReceive(
            topic,
            payload.toString(),
          ),
        );
      },
    );

    this.connection.on(
      'error',
      (error: Error | string) => {
        this.log.error(
          'IoTClient',
          'onError',
          error,
        );
      },
    );

    this.connection.on(
      'disconnect',
      async () => {
        this.log.info(
          'IoTClient',
          'onOffline',
          'Connection Offline',
        );
        if (this.connected) {
          this.connected = false;
          this.connection = undefined;
          await this.emitAsync(new IoTConnectionStateEvent(ConnectionState.Offline));
        }
      },
    );

    this.connection.on(
      'closed',
      async () => {
        this.log.info(
          'IoTClient',
          'onClose',
          'Connection Closed',
        );
        if (this.connected) {
          this.connected = false;
          this.connection = undefined;
          await this.emitAsync(new IoTConnectionStateEvent(ConnectionState.Closed));
        }
      },
    );
  }

  @OnEvent(
    'IOT.Unsubscribe', {
    async: true,
    nextTick: true,
  },
  )
  async unsubscribe(message: IoTEventData) {
    if (!message.topic) {
      this.log.info('No topic to unsubscribe from');
      return;
    }
    await this.lock.acquire();
    try {
      if (this.connection) {
        await promisify(this.connection.unsubscribe)(message.topic);
      }
      this.subscriptions.delete(message.topic);
      await this.emitAsync(
        new IoTUnsubscribedFromEvent(message.topic),
      );
    } catch (error) {
      await this.emitAsync(new IoTErrorEvent(error as Error));
    } finally {
      this.lock.release();
    }
  }

  @OnEvent(
    'IOT.Subscribe', {
    async: true,
    nextTick: true,
  },
  )
  async subscribe(message: IoTEventData) {
    if (!message.topic) {
      this.log.info('No topic to subscribe to');
      return;
    }
    await this.lock.acquire();
    try {
      if (!this.subscriptions.has(message.topic)) {
        this.log.info('Subscribing', message.topic);
        if (this.connection) {
          await this.connection.subscribe(
            message.topic,
            mqtt.QoS.AtLeastOnce
          );
        }
        this.subscriptions.add(message.topic);
        await this.emitAsync(new IoTSubscribedToEvent(message.topic));
      }
    } catch (error) {
      await this.emitAsync(new IoTErrorEvent(error as Error));
    } finally {
      this.lock.release();
    }
  }

  @OnEvent(
    'IOT.Publish', {
    async: true,
    nextTick: true,
  },
  )
  async publishTo(message: IoTEventData) {
    if (!this.connection) {
      this.log.warn('AWS Client not initialized.');
      return;
    }
    if (!message.topic) {
      this.log.info(
        'IoTClient',
        'publishTo',
        'No topic to publish to',
      );
      return;
    }

    await this.connection.publish(
      message.topic,
      message.payload,
      mqtt.QoS.AtLeastOnce,
    );
  }

  private async resubscribe() {
    for (let i = 0; i < this.subscriptions.size; i++) {
      await this.emitAsync(
        new IoTSubscribeToEvent(
          this.subscriptions[ i ],
        ),
      );
    }
  }
}
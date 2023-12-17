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
import { readFile } from 'fs/promises';
import { EOL } from 'os';
import { TextDecoder } from 'util';

@Injectable()
export class IoTClient
  extends GoveeClient {
  private readonly decoder = new TextDecoder();
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
    try {
      await this.lock.acquire();
      if (this.client && this.connection) {
        return;
      }
      if (!this.client || !this.config) {
        const certWithCA = [
          data.certificate.toString(),
          await readFile(this.caPath, 'utf-8')
        ].join(EOL);
        this.config = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder(
          certWithCA,
          data.privateKey.toString()
        )
          .with_client_id(`AP/${ data.accountId }/a${ this.clientId }`)
          .with_endpoint(data.endpoint)
          .with_clean_session(false)
          .build();

        this.client = new mqtt.MqttClient();
      }
      if (!this.connection) {
        this.connection = this.client.new_connection(this.config!);

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
              await this.resubscribe();
              await this.emitAsync(
                new IoTConnectionStateEvent(ConnectionState.Connected),
              );
            }
          },
        );

        this.connection.on(
          'resume',
          async () => {
            try {
              await this.lock.acquire();
              if (!this.connected) {
                this.log.info(
                  'IoTClient',
                  'onReconnect',
                  'Connection Reconnected',
                );
                this.connected = true;
                await this.emitAsync(
                  new IoTConnectionStateEvent(ConnectionState.Connected),
                );
                await this.resubscribe();
              }
            } finally {
              this.lock.release();
            }
          },
        );

        this.connection.on(
          'message',
          async (topic: string, payload: ArrayBuffer, dup: boolean, qos: mqtt.QoS, retain: boolean) => {
            console.dir(topic);
            console.dir(JSON.parse(this.decoder.decode(payload)));
            await this.emitAsync(
              new IotReceive(
                topic,
                this.decoder.decode(payload),
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
            try {
              await this.lock.acquire();
              if (this.connected) {
                this.log.info(
                  'IoTClient',
                  'onOffline',
                  'Connection Offline',
                );
                this.connected = false;
                this.connection = undefined;
                await this.emitAsync(new IoTConnectionStateEvent(ConnectionState.Offline));
              }
            } finally {
              this.lock.release();
            }
          },
        );

        this.connection.on(
          'closed',
          async () => {
            try {
              await this.lock.acquire();
              if (this.connected) {
                this.log.info(
                  'IoTClient',
                  'onClose',
                  'Connection Closed',
                );
                this.connected = false;
                this.connection = undefined;
                await this.emitAsync(new IoTConnectionStateEvent(ConnectionState.Closed));
              }
            } finally {
              this.lock.release();
            }
          },
        );
      }

      try {
        await this.connection.connect();
      } catch (error) {
        this.log.error("Error establishing connection to AWS services", error);
      }
    } finally {
      this.lock.release();
    }
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
        await this.connection.unsubscribe(message.topic);
      }
      this.subscriptions.delete(message.topic);
      await this.emitAsync(
        new IoTUnsubscribedFromEvent(message.topic),
      );
    } catch (error) {
      this.log.error(`Unexpected error unsubscribing from ${ message.topic }`, error);
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
      this.log.error(`Unexpected error subscribing to ${ message.topic }`);
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
import {device} from 'aws-iot-device-sdk';
import {GoveeClient} from './GoveeClient';
import {GOVEE_CLIENT_ID, IOT_CA_CERTIFICATE, IOT_CERTIFICATE, IOT_HOST, IOT_KEY} from '../../util/const';
import {Inject, Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {IoTConnectionStateEvent, IoTErrorEvent, IoTEventData} from '../../core/events/dataClients/iot/IoTEvent';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {IotReceive} from '../../core/events/dataClients/iot/IotReceive';
import {IoTSubscribedToEvent} from '../../core/events/dataClients/iot/IotSubscription';
import {IoTUnsubscribedFromEvent} from '../../core/events/dataClients/iot/IotRemoveSubscription';
import {LoggingService} from '../../logging/LoggingService';
import {Lock} from 'async-await-mutex-lock';
import {promisify} from 'util';

@Injectable()
export class IoTClient
  extends GoveeClient {
  private readonly awsIOTDevice: device;
  private connected = false;
  private lock = new Lock<void>();
  private readonly subscriptions: Set<string> = new Set<string>();

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(IOT_KEY) keyPath: string,
    @Inject(IOT_CERTIFICATE) certificatePath: string,
    @Inject(IOT_CA_CERTIFICATE) caPath: string,
    @Inject(GOVEE_CLIENT_ID) clientId: string,
    @Inject(IOT_HOST) host: string,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    this.awsIOTDevice = new device({
      clientId: clientId,
      certPath: certificatePath,
      keyPath: keyPath,
      caPath: caPath,
      host: host,
    });

    this.awsIOTDevice.on(
      'connect',
      () => {
        if (!this.connected) {
          this.connected = true;
          this.emit(
            new IoTConnectionStateEvent(ConnectionState.Connected),
          );
        }
      },
    );

    this.awsIOTDevice.on(
      'error',
      (error: Error | string) => {
        this.log.error('ERROR', error);
      },
    );

    this.awsIOTDevice.on(
      'close',
      () => {
        this.log.info('CLOSED');
        if (this.connected) {
          this.connected = false;
          this.emit(new IoTConnectionStateEvent(ConnectionState.Closed));
        }
      },
    );

    this.awsIOTDevice.on(
      'message',
      (topic: string, payload: string) => {
        this.emit(
          new IotReceive(
            topic,
            JSON.parse(payload.toString()),
          ),
        );
      },
    );
  }

  @OnEvent(
    'IOT.Unsubscribe',
    {
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
      await promisify(this.awsIOTDevice.unsubscribe)(message.topic);
      this.subscriptions.delete(message.topic);
      this.emit(
        new IoTUnsubscribedFromEvent(message.topic),
      );
    } catch (error) {
      this.emit(new IoTErrorEvent(error as Error));
    } finally {
      this.lock.release();
    }
  }

  @OnEvent(
    'IOT.Subscribe',
    {
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
        await promisify(this.awsIOTDevice.subscribe)(
          message.topic,
          undefined,
        );
        this.subscriptions.add(message.topic);
        this.emit(new IoTSubscribedToEvent(message.topic));
      }
    } catch (error) {
      this.emit(new IoTErrorEvent(error as Error));
    } finally {
      this.lock.release();
    }
  }

  @OnEvent(
    'IOT.Publish',
    {
      async: true,
      nextTick: true,
    },
  )
  publishTo(message: IoTEventData) {
    if (!message.topic) {
      this.log.info('No topic to publish to');
      return;
    }
    this.log.info('Publishing', message.topic, message.payload);
    this.awsIOTDevice.publish(
      message.topic,
      message.payload,
    );
  }
}
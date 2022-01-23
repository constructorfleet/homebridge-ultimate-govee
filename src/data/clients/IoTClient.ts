import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {GOVEE_CLIENT_ID, IOT_CA_CERTIFICATE, IOT_CERTIFICATE, IOT_HOST, IOT_KEY} from '../../util/const';
import {Inject, Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {IoTConnectionStateEvent, IoTErrorEvent, IoTEventData} from '../../core/events/dataClients/iot/IoTEvent';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {IotReceive} from '../../core/events/dataClients/iot/IotReceive';
import {IoTSubscribedToEvent} from '../../core/events/dataClients/iot/IotSubscription';
import {IoTUnsubscribedFromEvent} from '../../core/events/dataClients/iot/IotRemoveSubscription';

@Injectable()
export class IoTClient
  extends GoveeClient {
  private readonly awsIOTDevice: device;
  private connected = false;
  private readonly subcriptions: Set<string> = new Set<string>();

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(IOT_KEY) keyPath: string,
    @Inject(IOT_CERTIFICATE) certificatePath: string,
    @Inject(IOT_CA_CERTIFICATE) caPath: string,
    @Inject(GOVEE_CLIENT_ID) clientId: string,
    @Inject(IOT_HOST) host: string,
  ) {
    super(eventEmitter);
    this.awsIOTDevice = new device({
      clientId: clientId,
      certPath: path.resolve(certificatePath),
      keyPath: path.resolve(keyPath),
      caPath: path.resolve(caPath),
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
      'close',
      () => {
        if (this.connected) {
          this.connected = false;
          this.emit(new IoTConnectionStateEvent(ConnectionState.Closed));
        }
      },
    );

    this.awsIOTDevice.on(
      'message',
      (
        topic: string,
        payload: Record<string, unknown>,
      ) => {
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
    },
  )
  unsubscribe(message: IoTEventData) {
    if (!message.topic) {
      console.log('No topic to unsubscribe from');
      return;
    }
    this.awsIOTDevice.unsubscribe(
      message.topic,
      (err) => {
        if (err) {
          this.emit(new IoTErrorEvent(err));
        } else {
          this.subcriptions.delete(message.topic);
          this.emit(new IoTUnsubscribedFromEvent(message.topic));
        }
      },
    );
  }

  @OnEvent(
    'IOT.Subscribe',
    {
      async: true,
    },
  )
  subscribe(message: IoTEventData) {
    if (!message.topic) {
      console.log('No topic to subscribe to');
      return;
    }
    if (this.subcriptions.has(message.topic)) {
      return;
    }

    this.awsIOTDevice.subscribe(
      message.topic,
      undefined,
      (err) => {
        if (err) {
          this.emit(new IoTErrorEvent(err));
        } else {
          this.subcriptions.add(message.topic);
          this.emit(new IoTSubscribedToEvent(message.topic));
        }
      },
    );
  }

  @OnEvent(
    'IOT.Publish',
    {
      async: true,
    },
  )
  publishTo(message: IoTEventData) {
    if (!this.awsIOTDevice || !this.connected) {
      console.log('Not Connected to publish');
      return;
    }
    if (!message.topic) {
      console.log('No topic to publish to');
      return;
    }
    this.awsIOTDevice.publish(
      message.topic,
      message.payload,
    );
  }
}
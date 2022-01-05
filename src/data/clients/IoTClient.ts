import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {plainToInstance} from 'class-transformer';
import {GOVEE_CLIENT_ID, IOT_CA_CERTIFICATE, IOT_CERTIFICATE, IOT_HOST, IOT_KEY} from '../../util/const';
import {IoTAccountMessage} from '../structures/iot/IoTAccountMessage';
import {Inject, Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {IoTConnectionStateEvent, IoTErrorEvent, IoTEventData} from '../../core/events/dataClients/iot/IoTEvent';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {IotReceive} from '../../core/events/dataClients/iot/IotReceive';
import {IoTSubscribedToEvent, IoTSubscribeToEvent} from '../../core/events/dataClients/iot/IotSubscription';
import {IoTPublishTo} from '../../core/events/dataClients/iot/IoTPublish';

@Injectable()
export class IoTClient
  extends GoveeClient {
  private readonly awsIOTDevice: device;
  private connected = false;

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
        console.log(payload);

        this.emit(
          new IotReceive(
            topic,
            JSON.parse(payload.toString()),
          ),
        );
      },
    );
  }

  // unsubscribe(
  //   handler: MessageHandler<IoTDeviceMessage | IoTAccountMessage>,
  // ) {
  //   this.messageHandlers.delete(handler);
  //   if (handler.topic && !this.hasHandlerFor(handler.topic)) {
  //     this.awsIOTDevice.unsubscribe(handler.topic);
  //   }
  // }

  @OnEvent('IOT.Subscribe')
  subscribe(message: IoTEventData) {
    if (!message.topic) {
      console.log('No topic to subscribe to');
      return;
    }

    this.awsIOTDevice.subscribe(
      message.topic,
      undefined,
      (err, granted) => {
        if (err) {
          this.emit(new IoTErrorEvent(err));
        } else {
          this.emit(new IoTSubscribedToEvent(message.topic));
        }
      },
    );
  }

  @OnEvent('IOT.Publish')
  publishTo(message: IoTEventData) {
    console.log('PUBLISHING')
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
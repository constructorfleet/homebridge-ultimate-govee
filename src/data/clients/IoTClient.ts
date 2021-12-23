import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {
  IoTDeviceMessage,
  IotDeviceMessageEnvelope,
} from '../structures/iot/IotDeviceMessageEnvelope';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import {autoInjectable, inject} from 'tsyringe';
import {
  DEVICE_STATE_EVENT,
  GOVEE_CLIENT_ID,
  IOT_ACCOUNT_TOPIC,
  IOT_CA_CERTIFICATE,
  IOT_CERTIFICATE,
  IOT_CONNECTED_EVENT,
  IOT_DISCONNECTED_EVENT,
  IOT_HOST,
  IOT_KEY,
} from '../../util/const';
import {IoTAccountMessage} from '../structures/iot/IoTAccountMessage';
import {ExtendedSet} from '../../util/extendedSet';
import {Emits} from '../../util/events';

export interface MessageHandler<MessageType> {
  topic: string;

  handleMessage(
    topic: string,
    message: MessageType,
  );
}

@Emits(
  IOT_CONNECTED_EVENT,
  IOT_DISCONNECTED_EVENT,
  DEVICE_STATE_EVENT,
)
@autoInjectable()
export class IoTClient
  extends GoveeClient
  implements MessageHandler<IoTAccountMessage> {
  private awsIOTDevice: device;
  private messageHandlers = new ExtendedSet<MessageHandler<IoTDeviceMessage | IoTAccountMessage>>();
  private accountTopic: string;
  public topic: string;

  constructor(
    @inject(IOT_KEY) keyPath: string,
    @inject(IOT_CERTIFICATE) certificatePath: string,
    @inject(IOT_CA_CERTIFICATE) caPath: string,
    @inject(GOVEE_CLIENT_ID) clientId: string,
    @inject(IOT_HOST) host: string,
    @inject(IOT_ACCOUNT_TOPIC) accountTopic: string,
  ) {
    super();
    console.log('IOTCLIENT');
    this.accountTopic = accountTopic;
    this.topic = accountTopic;

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
        console.log('CONNECTED');
        this.emit(IOT_CONNECTED_EVENT);
        this.subscribe(this);
      },
    );

    this.awsIOTDevice.on(
      'close',
      () => {
        console.log('CLOSED');
        this.emit(IOT_DISCONNECTED_EVENT);
      },
    );

    this.awsIOTDevice.on(
      'message',
      (topic, payload) => {
        if (topic !== this.accountTopic) {
          return;
        }
        const message = plainToInstance(
          IoTAccountMessage,
          JSON.parse(payload.toString()),
        );

        this.emit(
          DEVICE_STATE_EVENT,
          message,
        );

        this.handlersFor(topic)
          .forEach(
            (handler) => handler.handleMessage(
              topic,
              message,
            ),
          );
      },
    );
  }

  handleMessage(topic: string, message: IoTAccountMessage) {
    return;
  }

  unsubscribe(
    handler: MessageHandler<IoTDeviceMessage | IoTAccountMessage>,
  ) {
    this.messageHandlers.delete(handler);
    if (!this.hasHandlerFor(handler.topic)) {
      this.awsIOTDevice.unsubscribe(handler.topic);
    }
  }

  subscribe(
    handler: MessageHandler<IoTDeviceMessage | IoTAccountMessage>,
  ) {
    if (!this.hasHandlerFor(handler.topic)) {
      console.log(`Subscribing to ${handler.topic}`);
      this.awsIOTDevice.subscribe(handler.topic);
    }
    this.messageHandlers.add(handler);
  }

  publishTo(message: IotDeviceMessageEnvelope) {
    this.awsIOTDevice.publish(
      message.topic,
      JSON.stringify(instanceToPlain(message)),
    );
  }

  private handlersFor(topic: string): ExtendedSet<MessageHandler<unknown>> {
    return this.messageHandlers.filter((handler) => handler.topic === topic);
  }

  private hasHandlerFor(topic: string): boolean {
    return this.messageHandlers.some((handler) => handler.topic === topic);
  }
}
import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {
  IoTDeviceMessage,
  IotDeviceMessageEnvelope,
} from '../structures/iot/IotDeviceMessageEnvelope';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import {autoInjectable, container, delay, inject} from 'tsyringe';
import {
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
import {AccountIoTListener} from '../../test';

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
)
@autoInjectable()
export class IoTClient
  extends GoveeClient {
  private awsIOTDevice: device;
  private messageHandlers = new ExtendedSet<MessageHandler<IoTDeviceMessage | IoTAccountMessage>>();
  private accountTopic: string;
  private listener: AccountIoTListener;

  constructor(
    @inject(IOT_KEY) keyPath: string,
    @inject(IOT_CERTIFICATE) certificatePath: string,
    @inject(IOT_CA_CERTIFICATE) caPath: string,
    @inject(GOVEE_CLIENT_ID) clientId: string,
    @inject(IOT_HOST) host: string,
    @inject(IOT_ACCOUNT_TOPIC) accountTopic: string,
    @inject(delay(() => AccountIoTListener)) listener: AccountIoTListener,
  ) {
    super();
    this.accountTopic = accountTopic;
    this.listener = listener;

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
        this.subscribe(this.listener);
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
        console.log('MESSAGE');
        const message =
          topic === container.resolve<string>(IOT_ACCOUNT_TOPIC)
            ? plainToInstance(
              IoTAccountMessage,
              JSON.parse(payload.toString()),
            )
            : plainToInstance(
              IoTDeviceMessage,
              JSON.parse(payload.toString()),
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
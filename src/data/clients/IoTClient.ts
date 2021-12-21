import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {
  IoTDeviceMessage,
  IotDeviceMessageEnvelope,
} from '../structures/iot/IotDeviceMessageEnvelope';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import {autoInjectable, container, inject} from 'tsyringe';
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
import {IoTMessage} from '../structures/iot/IoTMessage';
import {ExtendedSet} from '../../util/extendedSet';
import {Emits} from '../../util/events';

export interface MessageHandler<MessageType extends IoTMessage> {
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

  constructor(
    @inject(IOT_KEY) keyPath: string,
    @inject(IOT_CERTIFICATE) certificatePath: string,
    @inject(IOT_CA_CERTIFICATE) caPath: string,
    @inject(GOVEE_CLIENT_ID) clientId: string,
    @inject(IOT_HOST) host: string,
  ) {
    super();
    this.awsIOTDevice = new device({
      clientId: clientId,
      certPath: path.resolve(certificatePath),
      keyPath: path.resolve(keyPath),
      caPath: path.resolve(caPath),
      host: host,
    });

    this.awsIOTDevice.on(
      'connect',
      () => this.emit(IOT_CONNECTED_EVENT),
    );

    this.awsIOTDevice.on(
      'close',
      () => this.emit(IOT_DISCONNECTED_EVENT),
    );

    this.awsIOTDevice.on(
      'message',
      (topic, payload) => {
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

  private handlersFor(topic: string): ExtendedSet<MessageHandler<IoTMessage>> {
    return this.messageHandlers.filter((handler) => handler.topic === topic);
  }

  private hasHandlerFor(topic: string): boolean {
    return this.messageHandlers.some((handler) => handler.topic === topic);
  }
}
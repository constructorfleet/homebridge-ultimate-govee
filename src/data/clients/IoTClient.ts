import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {
  IoTDeviceMessage,
  IotDeviceMessageEnvelope,
} from '../structures/iot/IotDeviceMessageEnvelope';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import {autoInjectable, container, inject, singleton} from 'tsyringe';
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
  IOT_PUBLISH_EVENT,
  IOT_SUBSCRIBE_EVENT,
} from '../../util/const';
import {IoTAccountMessage} from '../structures/iot/IoTAccountMessage';
import {ExtendedSet} from '../../util/extendedSet';
import {Emits, EventHandler, Handles} from '../../core/events';

export interface MessageHandler<MessageType> {
  topic?: string;

  handleMessage(
    topic: string,
    message: MessageType,
  );
}

@singleton()
@Emits(
  IOT_CONNECTED_EVENT,
  IOT_DISCONNECTED_EVENT,
  DEVICE_STATE_EVENT,
)
@EventHandler()
@autoInjectable()
export class IoTClient
  extends GoveeClient
  implements MessageHandler<IoTAccountMessage> {
  private readonly awsIOTDevice: device;
  private messageHandlers = new ExtendedSet<MessageHandler<IoTDeviceMessage | IoTAccountMessage>>();
  private connected = false;

  public get topic(): string | undefined {
    if (!container.isRegistered(IOT_ACCOUNT_TOPIC)) {
      return undefined;
    }

    return container.resolve(IOT_ACCOUNT_TOPIC);
  }

  constructor(
    @inject(IOT_KEY) keyPath: string,
    @inject(IOT_CERTIFICATE) certificatePath: string,
    @inject(IOT_CA_CERTIFICATE) caPath: string,
    @inject(GOVEE_CLIENT_ID) clientId: string,
    @inject(IOT_HOST) host: string,
  ) {
    super();
    console.log('IotClient Const');
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
          if (this.topic) {
            this.subscribe(this);
          }
          this.emit(IOT_CONNECTED_EVENT);
        }
      },
    );

    this.awsIOTDevice.on(
      'close',
      () => {
        if (this.connected) {
          this.connected = false;
          this.emit(IOT_DISCONNECTED_EVENT);
        }
      },
    );

    this.awsIOTDevice.on(
      'message',
      (
        topic: string,
        payload: Record<string, unknown>,
      ) => {
        if (topic !== this.topic) {
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
          .forEach((handler) => {
              handler.handleMessage(
                topic,
                message,
              );
            },
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
    if (handler.topic && !this.hasHandlerFor(handler.topic)) {
      this.awsIOTDevice.unsubscribe(handler.topic);
    }
  }

  @Handles(IOT_SUBSCRIBE_EVENT)
  subscribe = (
    handler: MessageHandler<IoTDeviceMessage | IoTAccountMessage>,
  ): void => {
    console.log(`subscribe: ${handler.topic}`);
    if (handler.topic && !this.hasHandlerFor(handler.topic)) {
      console.log(`Subscribing to ${handler.topic}`);
      this.awsIOTDevice.subscribe(handler.topic);
    }
    this.messageHandlers.add(handler);
  };

  @Handles(IOT_PUBLISH_EVENT)
  publishTo = (message: IotDeviceMessageEnvelope): void => {
    console.log(`Publishing ${message} ${this}`);
    if (!this.awsIOTDevice) {
      console.log('Not Connected to publish');
      return;
    }
    console.log(`PUBLISHING ${message.topic} ${message.messagePayload}`);
    console.log(JSON.stringify(instanceToPlain(message.messagePayload)));
    this.awsIOTDevice.publish(
      message.topic,
      JSON.stringify(instanceToPlain(message.messagePayload)),
    );
  };

  private handlersFor = (topic: string): ExtendedSet<MessageHandler<unknown>> =>
    this.messageHandlers.filter((handler) => handler.topic === topic);

  private hasHandlerFor = (topic: string): boolean =>
    this.messageHandlers.some((handler) => handler.topic === topic);
}
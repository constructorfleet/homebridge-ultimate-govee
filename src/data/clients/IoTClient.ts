import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {Emits} from '../../util/events';
import {IotMessage} from '../structures/iot/device/IotMessage';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import {autoInjectable, container, inject} from 'tsyringe';
import {
  GOVEE_CLIENT_ID,
  IOT_ACCOUNT_TOPIC,
  IOT_CA_CERTIFICATE,
  IOT_CERTIFICATE, IOT_HOST,
  IOT_KEY,
} from '../../util/const';
import {IoTAccountMessage} from '../structures/iot/account/IoTAccountMessage';


@autoInjectable()
export class IoTClient extends GoveeClient {
  private awsIOTDevice: device;

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
      () => this.emit('IoTConnected'),
    );

    this.awsIOTDevice.on(
      'close',
      () => this.emit('IoTDisconnected'),
    );

    this.awsIOTDevice.on(
      'message',
      (topic, payload) => this.emit(
        'IoTMessageReceived',
        topic === container.resolve<string>(IOT_ACCOUNT_TOPIC)
          ? plainToInstance(IoTAccountMessage, JSON.parse(payload.toString()))
          : plainToInstance(IotMessage, JSON.parse(payload.toString())),
      ),
    );
  }

  subscribeTo(topic: string) {
    this.awsIOTDevice.subscribe(topic);
  }

  publishTo(message: IotMessage) {
    this.awsIOTDevice.publish(
      message.topic,
      JSON.stringify(instanceToPlain(message)),
    );
  }
}
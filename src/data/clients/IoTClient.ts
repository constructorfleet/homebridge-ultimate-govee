import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';
import {Emits} from '../../util/events';
import {IotMessage} from '../structures/iot/device/IotMessage';
import {instanceToPlain, plainToInstance} from 'class-transformer';
import {container} from 'tsyringe';
import {IOT_ACCOUNT_TOPIC} from '../../util/const';
import {IoTAccountMessage} from '../structures/iot/account/IoTAccountMessage';

@Emits<IoTClient>(
  'IoTConnected',
  'IoTDisconnected',
  'IoTMessageReceived',
)
export class IoTClient extends GoveeClient {
  private awsIOTDevice: device;

  constructor(
    keyPath: string,
    certificatePath: string,
    caPath: string,
    clientId: string,
    host: string,
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
import {device} from 'aws-iot-device-sdk';
import path from 'path';

export class AWSClient {
  private awsIOTDevice: device;

  constructor(
    keyPath: string,
    certificatePath: string,
    caPath: string,
    clientId: string,
    host: string,
  ) {
    this.awsIOTDevice = new device({
      clientId: clientId,
      certPath: path.resolve(certificatePath),
      keyPath: path.resolve(keyPath),
      caPath: path.resolve(caPath),
      host: host,
    });
  }
}
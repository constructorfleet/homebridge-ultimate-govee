import {device} from 'aws-iot-device-sdk';
import path from 'path';
import {GoveeClient} from './GoveeClient';

export class AWSClient extends GoveeClient {
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
  }
}
import {BLEConfig} from './configs/BLEConfig';
import {WiFiConfig} from './configs/WiFiConfig';
import {IoTConfig} from './configs/IoTConfig';

export interface DeviceConfig extends BLEConfig, WiFiConfig, IoTConfig {
  deviceId: string;

  name: string;

  model: string;

  pactType: number;

  pactCode: number;

  hardwareVersion?: string;

  softwareVersion?: string;
}
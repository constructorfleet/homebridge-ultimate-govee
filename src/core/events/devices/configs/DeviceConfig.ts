import {BLEConfig} from './BLEConfig';
import {WiFiConfig} from './WiFiConfig';
import {IoTConfig} from './IoTConfig';

export interface DeviceConfig extends BLEConfig, WiFiConfig, IoTConfig {
  deviceId: string;

  name: string;

  model: string;

  pactType: number;

  pactCode: number;

  hardwareVersion?: string;

  softwareVersion?: string;
}
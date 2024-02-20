import { Observable } from 'rxjs';
import { GoveePluginConfig } from '../config/v2/plugin-config.govee';
import { DeltaMap, DeltaSet, Device } from '@constructorfleet/ultimate-govee';
import {
  API,
  Characteristic,
  PlatformAccessory,
  PlatformConfig,
  PlatformName,
  PluginIdentifier,
  Service,
} from 'homebridge';
import { BinaryLike } from 'crypto';

export type PlatformStateType = {
  configuration: Observable<GoveePluginConfig>;
  accessories: DeltaMap<string, PlatformAccessory>;
  devices: DeltaSet<Device>;
};

export interface GoveeCredentials {
  username: string;
  password: string;
}

export interface GoveeConnections {
  enableIoT: boolean;
  enableBLE: boolean;
  enableAPI: boolean;
}

export interface PlatformModuleOptions {
  api: API;
  service: typeof Service;
  characteristic: typeof Characteristic;
  config: PlatformConfig;
  configPath: string;
  storagePath: string;
  registerAccessory: (
    pluginIdentifier: PluginIdentifier,
    platformName: PlatformName,
    accessories: PlatformAccessory[],
  ) => void;
  updateAccessory: (accessories: PlatformAccessory[]) => void;
  generateUUID: (data: BinaryLike) => string;
}

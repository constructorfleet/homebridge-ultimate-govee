import { Observable } from 'rxjs';
import { GoveePluginConfig } from '../config/v2/plugin-config.govee';
import { DeltaMap, DeltaSet, Device } from '@constructorfleet/ultimate-govee';
import {
  API,
  PlatformAccessory,
  PlatformConfig,
  Logger as HomebridgeLogger,
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

export type PlatformModuleOptions = {
  api: API;
  config: PlatformConfig;
  configPath: string;
  storagePath: string;
  log: HomebridgeLogger;
  generateUUID: (data: BinaryLike) => string;
};

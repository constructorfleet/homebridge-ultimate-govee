import {
  Device,
  DeviceStatesType,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { PlatformConfig } from 'homebridge';
import {
  DeviceConfig,
  RGBICLightDeviceConfig,
  RGBLightDeviceConfig,
} from './v2/devices';

export type PluginConfigModuleOptions = {
  config: PlatformConfig;
  path: string;
};

export type PluginEffectConfig = {
  name: string;
  code: number;
  description: string;
  enabled: boolean;
};

export type PluginDiyConfig = {
  name: string;
  code: number;
};

export type PluginDeviceConfig = {
  _type: string;
  id: string;
  name: string;
  ignore: boolean;
  debug: boolean;
  exposePrevious: boolean;
};

export type PluginRGBLightConfig = PluginDeviceConfig & {
  effects: PluginEffectConfig[];
  diy: PluginDiyConfig[];
};

export type PluginRGBICLightConfig = PluginRGBLightConfig & {
  showSegments: boolean;
};

export type PluginConfig = {
  version: number;
  name: string;
  platform: string;
  credentials: {
    username: string;
    password: string;
  };
  controlChannels: {
    iot: boolean;
    ble: boolean;
  };
  deviceConfigs: DeviceConfig[];
};

export type PlugConfigIndex = {
  index: number;
  config: PluginConfig;
};

export const FileStateUnloaded = 'UNLOADED';
export const FileStateNeedsChecked = 'NEEDS_CHECKED';
export const FileStateNeedsReloaded = 'NEEDS_RELOADED';
export const FileStateReloading = 'RELOADING';
export const FileStateNeedsUpdated = 'NEEDS_UPDATED';
export const FileStateWriting = 'WRITING';
export const FileStateIdle = 'IDLE';
export const ConfigFileStates = [
  FileStateUnloaded,
  FileStateIdle,
  FileStateNeedsChecked,
  FileStateNeedsReloaded,
  FileStateReloading,
  FileStateNeedsUpdated,
  FileStateWriting,
] as const;
export const ConfigFileState = {
  Unloaded: FileStateUnloaded,
  Idle: FileStateIdle,
  NeedsChecked: FileStateNeedsChecked,
  NeedsReloaded: FileStateNeedsReloaded,
  Reloading: FileStateReloading,
  NeedsUpdated: FileStateNeedsUpdated,
  Writing: FileStateWriting,
};
export type ConfigFileState =
  | typeof FileStateUnloaded
  | typeof FileStateIdle
  | typeof FileStateNeedsChecked
  | typeof FileStateNeedsReloaded
  | typeof FileStateReloading
  | typeof FileStateNeedsUpdated
  | typeof FileStateWriting;

export type ConfigType<States extends DeviceStatesType> =
  Device<States> extends RGBICLightDevice
    ? RGBICLightDeviceConfig
    : Device<States> extends RGBLightDevice
      ? RGBLightDeviceConfig
      : DeviceConfig;

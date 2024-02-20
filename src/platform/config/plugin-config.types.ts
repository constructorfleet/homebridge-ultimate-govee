import { PlatformConfig } from 'homebridge';

export type PluginConfigModuleOptions = {
  config: PlatformConfig;
  path: string;
};

export type PluginDeviceConfig = {
  id: string;
  name: string;
  ignore: boolean;
  debug: boolean;
};

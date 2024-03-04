import { Device } from '@constructorfleet/ultimate-govee';
import { DynamicModule } from '@nestjs/common';
import { PlatformAccessory } from 'homebridge';

export type AccessoryModuleOptions = {
  core: DynamicModule;
  logger: DynamicModule;
  pluginConfig: DynamicModule;
  accessories?: PlatformAccessory<Device>[];
};

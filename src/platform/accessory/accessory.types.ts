import { Device } from '@constructorfleet/ultimate-govee';
import { PlatformAccessory } from 'homebridge';

export type AccessoryModuleOptions = {
  accessories?: PlatformAccessory<Device>[];
};

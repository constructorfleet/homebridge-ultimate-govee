import { Device } from '@constructorfleet/ultimate-govee';
import { PlatformAccessory } from 'homebridge';

export type GoveeAccessory = {
  id: string;
  accessory: PlatformAccessory;
  device: Device;
};

export type AccessoryModuleOptions = {
  accessories?: GoveeAccessory[];
};

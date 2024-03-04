import { Device, RGBICLightDevice } from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { PlatformAccessory } from 'homebridge';

export const LightEffectAccessory = (device: Device): PlatformAccessory[] => {
  if ([RGBICLightDevice.deviceType].includes(device.deviceType)) {
  }
};

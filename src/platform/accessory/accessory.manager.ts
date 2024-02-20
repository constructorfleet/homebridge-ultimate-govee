import { Injectable } from '@nestjs/common';
import { API, PlatformAccessory } from 'homebridge';
import { InjectHomebridgeApi } from '../../core';
import { Device } from '@constructorfleet/ultimate-govee';

@Injectable()
export class AccessoryManager {
  private readonly accessories: Map<string, PlatformAccessory> = new Map<
    string,
    PlatformAccessory
  >();

  constructor(@InjectHomebridgeApi private readonly api: API) {}

  async onAccessoryLoaded(accessory: PlatformAccessory) {
    await console.dir(accessory);
  }

  async onDeviceUpdated(device: Device) {
    await console.dir(device);
  }
}

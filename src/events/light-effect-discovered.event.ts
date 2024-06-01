import {
  Device,
  DeviceStatesType,
  LightEffect,
} from '@constructorfleet/ultimate-govee';

export class LightEffectDiscoveredEvent<States extends DeviceStatesType> {
  constructor(
    readonly device: Device<States>,
    readonly effect: LightEffect,
  ) {}
}

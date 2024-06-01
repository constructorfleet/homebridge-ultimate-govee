import {
  Device,
  DeviceStatesType,
  DiyEffect,
} from '@constructorfleet/ultimate-govee';

export class DiyEffectDiscoveredEvent<States extends DeviceStatesType> {
  constructor(
    readonly device: Device<States>,
    readonly effect: DiyEffect,
  ) {}
}

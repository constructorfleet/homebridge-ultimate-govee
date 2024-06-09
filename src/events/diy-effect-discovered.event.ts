import {
  Device,
  DeviceStatesType,
  DiyEffect,
} from '@constructorfleet/ultimate-govee';
import { BaseEvent } from './base.event';

export class DiyEffectDiscoveredEvent<
  States extends DeviceStatesType,
> extends BaseEvent {
  constructor(
    readonly device: Device<States>,
    readonly effect: DiyEffect,
  ) {
    super();
  }
}

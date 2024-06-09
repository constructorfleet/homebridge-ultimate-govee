import {
  Device,
  DeviceStatesType,
  LightEffect,
} from '@constructorfleet/ultimate-govee';
import { BaseEvent } from './base.event';

export class LightEffectRemovedEvent<
  States extends DeviceStatesType,
> extends BaseEvent {
  constructor(
    readonly device: Device<States>,
    readonly effect: LightEffect,
  ) {
    super();
  }
}

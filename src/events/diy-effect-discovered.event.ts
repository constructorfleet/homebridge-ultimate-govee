import {
  Device,
  DeviceStatesType,
  DiyEffect,
} from '@constructorfleet/ultimate-govee';
import { BaseEvent } from './base.event';
import { Logger } from '@nestjs/common';

export class DiyEffectDiscoveredEvent<
  States extends DeviceStatesType,
> extends BaseEvent {
  constructor(
    readonly device: Device<States>,
    readonly effect: DiyEffect,
  ) {
    super();
    if (device.id === '5F:D3:7C:A6:B0:4A:17:8C') {
      new Logger(DiyEffectDiscoveredEvent.name).warn({
        device: {
          id: device.id,
          name: device.name,
        },
        effect,
      });
    }
  }
}

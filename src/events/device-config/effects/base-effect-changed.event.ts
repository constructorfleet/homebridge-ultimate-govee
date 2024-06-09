import { DeviceConfigChangedEvent } from '../device-config-changed.event';

export abstract class BaseEffectChangedEvent extends DeviceConfigChangedEvent {
  protected constructor(
    deviceId: string,
    readonly effectType: string,
    readonly code: number,
  ) {
    super(deviceId);
  }
}

import { DeviceConfig } from '../../config';
import { DeviceConfigChangedEvent } from './device-config-changed.event';

export class DeviceConfigUpdatedEvent extends DeviceConfigChangedEvent {
  constructor(
    deviceId: string,
    readonly deviceConfig: DeviceConfig,
  ) {
    super(deviceId);
  }
}

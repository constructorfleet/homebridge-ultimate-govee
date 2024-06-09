import { DeviceConfigChangedEvent } from './device-config-changed.event';

export class NameDeviceChangedEvent extends DeviceConfigChangedEvent {
  constructor(
    deviceId: string,
    readonly name: string,
  ) {
    super(deviceId);
  }
}

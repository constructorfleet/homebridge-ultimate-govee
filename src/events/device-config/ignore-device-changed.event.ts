import { DeviceConfigChangedEvent } from './device-config-changed.event';

export class IgnoreDeviceChangedEvent extends DeviceConfigChangedEvent {
  constructor(
    deviceId: string,
    readonly ignoreDevice: boolean,
  ) {
    super(deviceId);
  }
}

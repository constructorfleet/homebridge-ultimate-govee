import { DeviceConfigChangedEvent } from './device-config-changed.event';

export class ExposePreviousDeviceChanged extends DeviceConfigChangedEvent {
  constructor(
    deviceId: string,
    readonly exposePrevious: boolean,
  ) {
    super(deviceId);
  }
}

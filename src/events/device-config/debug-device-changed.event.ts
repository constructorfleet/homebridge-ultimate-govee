import { DeviceConfigChangedEvent } from './device-config-changed.event';

export class DebugDeviceChangedEvent extends DeviceConfigChangedEvent {
  constructor(
    deviceId: string,
    readonly enableDebugging: boolean,
  ) {
    super(deviceId);
  }
}

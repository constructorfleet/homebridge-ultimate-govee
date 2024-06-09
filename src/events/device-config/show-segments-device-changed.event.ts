import { DeviceConfigChangedEvent } from './device-config-changed.event';

export class ShowSegmentsDeviceChangedEvent extends DeviceConfigChangedEvent {
  constructor(
    deviceId: string,
    readonly showSegments: boolean,
  ) {
    super(deviceId);
  }
}

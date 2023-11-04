import {DeviceEvent} from './DeviceEvent';

export type DeviceRefreshData = {
  deviceId: string;
};

export class DeviceRefreshEvent
  extends DeviceEvent<DeviceRefreshData> {

  constructor(eventData: DeviceRefreshData) {
    super(
      'Refresh',
      eventData,
    );
  }
}

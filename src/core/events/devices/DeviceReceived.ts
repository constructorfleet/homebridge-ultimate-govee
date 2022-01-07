import {DeviceEvent} from './DeviceEvent';
import {AppDeviceData, AppDeviceSettingsResponse} from '../../../data/structures/api/responses/payloads/AppDeviceListResponse';
import {DeviceState} from '../../structures/devices/DeviceState';

export abstract class DeviceReceivedEvent<DataType>
  extends DeviceEvent<DataType> {

  protected constructor(eventName: string, eventData: DataType) {
    super(`RECEIVED.${eventName}`, eventData);
  }
}

export class DeviceSettingsReceived
  extends DeviceReceivedEvent<AppDeviceSettingsResponse> {

  constructor(eventData: AppDeviceSettingsResponse) {
    super('Settings', eventData);
  }
}

export class DeviceStateReceived
  extends DeviceReceivedEvent<DeviceState> {

  constructor(eventData: DeviceState) {
    super('State', eventData);
  }
}
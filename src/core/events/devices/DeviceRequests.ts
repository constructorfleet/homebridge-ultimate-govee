import {DeviceEvent} from './DeviceEvent';

export abstract class DeviceRequestEvent<DataType>
  extends DeviceEvent<DataType> {

  protected constructor(eventName: string, eventData: DataType) {
    super(`Request.${eventName}`, eventData);
  }
}

export class DeviceSettingRequest
  extends DeviceEvent<string | undefined> {

  constructor(eventData: string | undefined = undefined) {
    super('Settings', eventData);
  }
}

export class DeviceStateRequest
  extends DeviceEvent<string | undefined> {

  constructor(eventData: string | undefined = undefined) {
    super('State', eventData);
  }
}
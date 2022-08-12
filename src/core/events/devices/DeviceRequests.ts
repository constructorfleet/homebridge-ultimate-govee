import {DeviceEvent} from './DeviceEvent';
import {GoveeDevice} from '../../../devices/GoveeDevice';

export abstract class DeviceRequestEvent<DataType>
  extends DeviceEvent<DataType> {

  protected constructor(eventName: string, eventData: DataType) {
    super(`REQUEST.${eventName}`, eventData);
  }
}

export class DeviceSettingRequest
  extends DeviceEvent<string | undefined> {

  constructor(eventData: string | undefined = undefined) {
    super('Settings', eventData);
  }
}

export class DevicePollRequest
  extends DeviceRequestEvent<string> {

  constructor(
    eventData: string,
  ) {
    super(
      'Poll',
      eventData,
    );
  }
}

export class DeviceStateRequest
  extends DeviceRequestEvent<GoveeDevice> {

  constructor(
    eventData: GoveeDevice,
  ) {
    super(
      'State',
      eventData,
    );
  }
}

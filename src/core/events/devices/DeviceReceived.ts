import {DeviceEvent} from './DeviceEvent';
import {DeviceState} from '../../structures/devices/DeviceState';
import {DeviceConfig} from '../../structures/devices/DeviceConfig';

export abstract class DeviceReceivedEvent<DataType>
    extends DeviceEvent<DataType> {

  protected constructor(eventName: string, eventData: DataType) {
    super(`RECEIVED.${eventName}`, eventData);
  }
}

export class DeviceSettingsReceived
    extends DeviceReceivedEvent<DeviceConfig> {

  constructor(eventData: DeviceConfig) {
    super('Settings', eventData);
  }
}

export class DeviceStateReceived
    extends DeviceReceivedEvent<DeviceState> {

  constructor(eventData: DeviceState) {
    super('State', eventData);
  }
}

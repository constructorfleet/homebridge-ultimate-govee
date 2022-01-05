import {DeviceEvent} from './DeviceEvent';

export abstract class DeviceCommandEvent<DataType>
  extends DeviceEvent<DataType> {

  protected constructor(eventName: string, eventData: DataType) {
    super(`Command.${eventName}`, eventData);
  }
}

export class DeviceCommand
  extends DeviceCommandEvent<unknown> {

  constructor(eventData: unknown) {
    super('TODO', eventData);
  }
}
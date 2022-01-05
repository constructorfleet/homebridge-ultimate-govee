import {RestEvent} from './RestEvent';

export abstract class RestRequestEvent<DataType>
  extends RestEvent<DataType> {

  protected constructor(
    eventName: string,
    eventData: DataType,
  ) {
    super(`REQUEST.${eventName}`,
      eventData);
  }
}

export class RestRequestDevices
  extends RestRequestEvent<void> {

  constructor() {
    super('Devices');
  }
}

export class RestRequestDevice
  extends RestRequestEvent<string | undefined> {

  constructor(eventData: string | undefined) {
    super('Device', eventData);
  }
}
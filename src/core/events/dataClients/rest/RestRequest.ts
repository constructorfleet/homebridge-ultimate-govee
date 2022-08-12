import {RestEvent} from './RestEvent';
import {GoveeDevice} from '../../../../devices/GoveeDevice';

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

export class RestRequestDIYEffects
    extends RestRequestEvent<void> {

  constructor() {
    super('DIYEffects');
  }
}

export class RestRequestDeviceScenes
    extends RestRequestEvent<GoveeDevice> {

  constructor(eventData: GoveeDevice) {
    super(
        'DeviceScenes',
        eventData,
    );
  }
}

export class RestRequestDevice
    extends RestRequestEvent<string | undefined> {

  constructor(eventData: string | undefined) {
    super('Device', eventData);
  }
}

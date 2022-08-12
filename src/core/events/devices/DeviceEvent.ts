import {Event} from '../Event';

export abstract class DeviceEvent<EventDataType>
  extends Event<EventDataType> {

  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      `DEVICE.${eventName}`,
      eventData,
    );
  }
}

import {Event} from '../../../core/events/Event';

export abstract class PlatformEvent<EventDataType>
  extends Event<EventDataType> {

  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      `PLATFORM.${eventName}`,
      eventData,
    );
  }
}
import {Event} from '../Event';

export abstract class EffectEvent<EventDataType>
    extends Event<EventDataType> {

  protected constructor(
      eventName: string,
      eventData?: EventDataType,
  ) {
    super(
        `EFFECT.${eventName}`,
        eventData,
    );
  }
}

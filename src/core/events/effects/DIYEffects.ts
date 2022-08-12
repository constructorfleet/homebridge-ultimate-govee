import {EffectEvent} from './EffectEvent';
import {DIYEffect} from '../../structures/api/responses/payloads/DIYListResponse';
import {DIYLightEffect} from '../../../effects/implementations/DIYLightEffect';

export abstract class DIYEffectEvent<EventDataType>
  extends EffectEvent<EventDataType> {

  protected constructor(
    eventName: string,
    eventData: EventDataType,
  ) {
    super(
      `DIY.${eventName}`,
      eventData,
    );
  }
}

export class DIYEffectReceived
  extends DIYEffectEvent<DIYEffect[]> {

  constructor(
    eventData: DIYEffect[],
  ) {
    super('Received', eventData);
  }
}

export class DIYEffectDiscovered
  extends DIYEffectEvent<DIYLightEffect[]> {

  constructor(
    eventData: DIYLightEffect[],
  ) {
    super('Discovered', eventData);
  }
}

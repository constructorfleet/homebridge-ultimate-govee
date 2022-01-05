import {EventEmitter2} from '@nestjs/event-emitter';
import {Event} from '../core/events/Event';

export type Constructor<TypeClass> = new (...args) => TypeClass;

export abstract class Emitter {
  protected constructor(
    private eventEmitter: EventEmitter2,
  ) {
  }

  public emit<EventData, EventType extends Event<EventData>>(
    event: EventType,
  ) {
    this.eventEmitter.emit(
      event.eventName,
      event.eventData,
    );
  }
}
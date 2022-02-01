import {EventEmitter2} from '@nestjs/event-emitter';
import {Event} from '../core/events/Event';

export type Constructor<TypeClass> = new (...args) => TypeClass;

export type StandardEnum<T> = {
  [id: string]: T | string;
  [nu: number]: string;
}

export abstract class Emitter {
  protected constructor(
    private eventEmitter: EventEmitter2,
  ) {
  }

  public getHandlers(eventName: string) {
    return this.eventEmitter.listeners(eventName);
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
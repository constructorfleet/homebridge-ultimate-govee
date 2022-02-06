import {EventEmitter2} from '@nestjs/event-emitter';
import {Event} from '../core/events/Event';

export type Constructor<TypeClass> = new (...args) => TypeClass;

export type StandardEnum<T> = {
  [id: string]: T | string;
  [nu: number]: string;
};

export abstract class Emitter {
  protected constructor(
    private eventEmitter: EventEmitter2,
  ) {
  }

  public get emitter(): EventEmitter2 {
    return this.eventEmitter;
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

export async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}
import {EventEmitter2} from '@nestjs/event-emitter';
import {Event} from '../core';

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

  public async emitAsync<EventData, EventType extends Event<EventData>>(
    event: EventType,
  ) {
    await this.eventEmitter.emitAsync(
      event.eventName,
      event.eventData,
    );
  }
}

export async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

import { EventEmitter2 } from '@nestjs/event-emitter';

export abstract class BaseEvent {
  protected constructor() {}

  async emit(eventEmitter: EventEmitter2) {
    await eventEmitter.emitAsync(this.constructor.name, this);
  }
}

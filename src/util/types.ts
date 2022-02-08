import {EventEmitter2} from '@nestjs/event-emitter';
import {Event} from '../core/events/Event';

type Callback<A> = (args: A) => void;

export const safePromisify = <T, A>(fn: (args: T, cb: Callback<A>) => void): ((args: T) => Promise<A>) =>
  (args: T) => new Promise((resolve) => {
    fn(args, (callbackArgs) => {
      resolve(callbackArgs);
    });
  });

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

export async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}
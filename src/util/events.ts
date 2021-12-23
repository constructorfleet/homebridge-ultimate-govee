import {EventEmitter} from 'events';
import {container} from 'tsyringe';
import {Constructor} from './types';
import {METADATA_KEY_EVENT_HANDLER} from './const';

export function Emits<ClassType extends EventEmitter>(
  ...events: string[]
): (target: Constructor<ClassType>) => void {
  return function(target: Constructor<ClassType>) {
    const constructorWrapper = function(...args): ClassType {
      const emitter = new target(...args);
      events.forEach((event) => {
        container.registerInstance(
          `${event}_Emitter`,
          emitter,
        );

        if (container.isRegistered(`${event}_Handler`)) {
          console.log('EMITS - addingListeners');
          container.resolveAll<(...args: unknown[]) => void>(`${event}_Handler`)
            .forEach(
              (handler) => emitter.on(
                event,
                handler,
              ),
            );
        }
      });

      return emitter;
    };

    constructorWrapper.prototype = target.prototype;
    return constructorWrapper;
  };
}

export function EventHandler<ClassType>(): (target: Constructor<ClassType>) => void {
  return function(target: Constructor<ClassType>) {
    const constructorWrapper = function(...args): ClassType {
      const handler = new target(...args);
      const properties: string[] = Reflect.getMetadata(
        METADATA_KEY_EVENT_HANDLER,
        handler,
      );

      properties.forEach(
        (property) => {
          const [propertyKey, event] = property.split('|');

          container.registerInstance(
            `${event}_Handler`,
            handler[propertyKey],
          );

          if (container.isRegistered(`${event}_Emitter`)) {
            console.log('EVENTHANDLER - Adding handlers');
            container.resolveAll<EventEmitter>(
              `${event}_Emitter`,
            )
              .forEach((emitter) =>
                emitter.on(
                  event,
                  target[propertyKey],
                ),
              );
          }
        },
      );

      return handler;
    };

    constructorWrapper.prototype = target.prototype;
    return constructorWrapper;
  };
}

export function Handles(
  event: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => void {
  return function(
    target: unknown,
    propertyKey: string,
  ) {
    const properties: string[] = Reflect.getMetadata(
      METADATA_KEY_EVENT_HANDLER,
      target as Record<string, unknown>,
    ) || [];

    properties.push(`${propertyKey}|${event}`);

    Reflect.defineMetadata(
      METADATA_KEY_EVENT_HANDLER,
      properties,
      target as Record<string, unknown>,
    );
  };
}

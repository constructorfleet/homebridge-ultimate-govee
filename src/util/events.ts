import {EventEmitter} from 'events';
import {container} from 'tsyringe';
import {METADATA_KEY_EVENT_HANDLER} from './const';
import {constructor} from 'tsyringe/dist/typings/types';

export function Emits<ClassType extends EventEmitter>(
  ...events: string[]
): (target: constructor<ClassType>) => void {
  return function(target: constructor<ClassType>) {
    const constructorWrapper = function(...args): ClassType {
      const emitter = new target(...args);
      events.forEach((event) => {
        container.registerInstance(
          `${event}_Emitter`,
          emitter,
        );

        if (container.isRegistered(`${event}_Handler`)) {
          console.log('EMITS - addingListeners', event);
          container.resolveAll<(...args: unknown[]) => void>(`${event}_Handler`)
            .forEach(
              (handler) => {
                console.log(handler);
                emitter.listeners(event)
                  .includes(handler)
                || emitter.on(
                  event,
                  handler,
                );
              },
            );
        }
      });

      return emitter;
    };

    constructorWrapper.prototype = target.prototype;
    return constructorWrapper;
  };
}

export function EventHandler<ClassType>(): (target: constructor<ClassType>) => void {
  return function(target: constructor<ClassType>) {
    const constructorWrapper = function(...args): ClassType {
      console.log(`CREATING ${target}`);
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
                  emitter.listeners(event)
                    .includes(handler[propertyKey])
                  || emitter.on(
                    event,
                    handler[propertyKey],
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
    console.log(`HANDLES ${target}`);
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

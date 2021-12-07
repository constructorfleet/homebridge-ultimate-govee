import {EventEmitter} from 'events';
import {container} from 'tsyringe';

class EventHandler<ListenerType> {
  constructor(
    public target: ListenerType,
    public propertyKey: string,
    public descriptor: PropertyDescriptor,
  ) {
  }
}

export function Handles<ListenerType, EventDataType>(
  eventName: string,
  eventDataMatcher?: Record<string, unknown>,
) {
  return (
    target: ListenerType,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const value = descriptor.value;
    descriptor.value = (
      event: string,
      eventData?: EventDataType,
    ) => {
      if (eventName !== event) {
        return;
      }
      if (!eventDataMatcher) {
        return value.apply(eventData);
      }

      const matches = Object.entries(eventDataMatcher).
        filter(([dataKey, dataValue]) => {
          return eventData![dataKey] === dataValue;
        }).length > 0;

      if (matches) {
        return value.apply(eventData);
      }
    };

    container.registerInstance(
      `${eventName}_Handler`,
      new EventHandler(
        target,
        propertyKey,
        descriptor,
      ),
    );
  };
}

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

        container.resolveAll<EventHandler<never>>(`${event}_Handler`).
          forEach((eventHandler) => {
            emitter.addListener(
              event,
              (eventData) => eventHandler.descriptor.value.apply(eventData),
            );
          });
      });

      return emitter;
    };

    constructorWrapper.prototype = target.prototype;
    return constructorWrapper;
  };
}

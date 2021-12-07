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

export interface EventDataMatcher<DataType, ListenerType> {
  field: string;

  is: DataType | ((listener: ListenerType) => DataType);
}

export function Handles<ListenerType, EventDataType>(
  eventName: string,
  ...matchers: EventDataMatcher<unknown, ListenerType>[]
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
      if (!matchers || matchers.length === 0) {
        return value.apply(eventData);
      }

      if (!eventData) {
        return;
      }

      if (matchers.filter((matcher) => {
        const dataValue = eventData[matcher.field];
        return (typeof matcher.is === 'function')
          ? matcher.is(target) === dataValue
          : matcher.is === dataValue;
      }).length === matchers.length) {
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

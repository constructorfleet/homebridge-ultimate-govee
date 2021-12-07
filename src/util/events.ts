import 'reflect-metadata';
import {EventEmitter} from 'events';
import {container} from 'tsyringe';

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
      });

      return emitter;
    };

    constructorWrapper.prototype = target.prototype;
    return constructorWrapper;
  };
}

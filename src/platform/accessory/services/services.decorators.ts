import { Device } from '@constructorfleet/ultimate-govee';
import { ClassConstructor } from 'class-transformer';
import { Service } from 'homebridge';
import { DeviceServiceMap } from './services.const';

export function RegisterService<T extends ClassConstructor<Service>>(deviceType: ClassConstructor<Device>): (ctor: T) => void {
    return (ctor: T) => {
      const services: ClassConstructor<Service>[] = DeviceServiceMap.get(deviceType) ?? [] as ClassConstructor<Service>[];
      services.push(ctor);

      DeviceServiceMap.set(deviceType, services);
      return ctor;
    };
  }
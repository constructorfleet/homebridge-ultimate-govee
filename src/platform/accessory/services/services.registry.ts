import { Device } from '@constructorfleet/ultimate-govee';
import { ClassConstructor } from 'class-transformer';
import { Service } from 'homebridge';

export class ServiceRegistry {
  static DeviceServiceMap = new Map<
    ClassConstructor<Device>,
    ClassConstructor<Service>[]
  >();
  static register<T extends ClassConstructor<Service>>(
    deviceType: ClassConstructor<Device>,
  ): (ctor: T) => void {
    return (ctor: T) => {
      const services: ClassConstructor<Service>[] =
        this.DeviceServiceMap.get(deviceType) ??
        ([] as ClassConstructor<Service>[]);
      services.push(ctor);

      this.DeviceServiceMap.set(deviceType, services);
      return ctor;
    };
  }

  getServices(device: Device): Service[] | undefined {
    return (
      ServiceRegistry.DeviceServiceMap.get(
        device.constructor as ClassConstructor<Device>,
      ) ?? ServiceRegistry.DeviceServiceMap.get(Device)
    )?.map((ctor) => new ctor(device));
  }
}

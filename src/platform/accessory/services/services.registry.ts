import { Device } from '@constructorfleet/ultimate-govee';
import { ClassConstructor } from 'class-transformer';
import { PlatformAccessory, Service, WithUUID } from 'homebridge';

export class ServiceRegistry {
  static DeviceServiceMap = new Map<
    ClassConstructor<Device>,
    WithUUID<ClassConstructor<Service>>[]
  >();
  static register<T extends WithUUID<ClassConstructor<Service>>>(
    deviceType: ClassConstructor<Device>,
  ): (ctor: T) => void {
    return (ctor: T) => {
      const services: WithUUID<ClassConstructor<Service>>[] =
        this.DeviceServiceMap.get(deviceType) ??
        ([] as WithUUID<ClassConstructor<Service>>[]);
      services.push(ctor);

      this.DeviceServiceMap.set(deviceType, services);
      return ctor;
    };
  }

  getServices(
    device: Device,
    accessory: PlatformAccessory,
  ): Service[] | undefined {
    return (
      ServiceRegistry.DeviceServiceMap.get(
        device.constructor as ClassConstructor<Device>,
      ) ?? ServiceRegistry.DeviceServiceMap.get(Device)
    )?.map(
      (ctor) => accessory.getServiceById(ctor.UUID, '') ?? new ctor(device),
    );
  }
}

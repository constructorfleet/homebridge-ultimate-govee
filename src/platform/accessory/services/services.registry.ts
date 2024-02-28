import { Device } from '@constructorfleet/ultimate-govee';
import { ClassConstructor } from 'class-transformer';
import { PlatformAccessory, Service, WithUUID } from 'homebridge';
import { LoggingService } from '../../../logger/logger.service';
import { Lock } from 'async-await-mutex-lock';
import { GoveeService } from './govee-service';

export class ServiceRegistry {
  static DeviceServiceMap = new Map<
    string,
    WithUUID<ClassConstructor<Service>>[]
  >();
  static DeviceStateMap = new Map<
    string,
    WithUUID<ClassConstructor<Service>>[]
  >();

  private static lockService: Lock<void> = new Lock();
  private static lockState: Lock<void> = new Lock();

  static {
    this.DeviceServiceMap.set(Device.name, []);
  }

  static registerForStateNames(...stateNames: string[]): (ctor) => void {
    return (ctor) => {
      stateNames.forEach(async (stateName) => {
        await this.lockState.acquire();
        try {
          const services: WithUUID<ClassConstructor<Service>>[] =
            this.DeviceStateMap.get(stateName) ??
            ([] as WithUUID<ClassConstructor<Service>>[]);
          services.push(ctor);

          this.DeviceStateMap.set(stateName, services);
        } finally {
          this.lockState.release();
        }
      });
      return ctor;
    };
  }

  static register(...deviceTypes: ClassConstructor<Device>[]): (ctor) => void {
    return (ctor) => {
      deviceTypes.forEach(async (deviceType) => {
        await this.lockService.acquire();
        try {
          const services: WithUUID<ClassConstructor<Service>>[] =
            this.DeviceServiceMap.get(deviceType.name) ??
            ([] as WithUUID<ClassConstructor<Service>>[]);
          services.push(ctor);

          this.DeviceServiceMap.set(deviceType.name, services);
        } finally {
          this.lockService.release();
        }
      });
      return ctor;
    };
  }

  private loggingService!: LoggingService;
  set logger(logger: LoggingService) {
    this.loggingService = logger;
  }

  get logger(): LoggingService {
    return this.loggingService;
  }

  private getServicesForDevice(
    device: Device,
    accessory: PlatformAccessory,
  ): (Service & GoveeService)[] {
    return (
      (
        ServiceRegistry.DeviceServiceMap.get(device.constructor.name) ??
        ServiceRegistry.DeviceServiceMap.get(Device.name)
      )
        ?.map((ctor) => {
          let service = accessory.services.find(
            (service) => service.UUID === ctor.UUID,
          );
          if (service === undefined) {
            service = accessory.addService(new ctor(device));
          }
          if (!('update' in service)) {
            accessory.removeService(service);
            service = accessory.addService(new ctor(device));
          }
          try {
            (service as unknown as { update(device): void }).update(device);
            if (
              'isPrimary' in service &&
              typeof service.isPrimary === 'boolean'
            ) {
              service.setPrimaryService(service.isPrimary);
            }
            return service as Service & GoveeService;
          } catch (err) {
            this.logger.error(
              `Unable to get service ${service?.name} for ${device.id} ${device.constructor.name}`,
            );
            throw err;
          }
        })
        ?.filter((service) => service !== undefined)
        ?.map((service) => service! as Service & GoveeService) ?? []
    );
  }

  private getServicesForDeviceStates(
    device: Device,
    accessory: PlatformAccessory,
  ): Service[] {
    const stateNames: string[] = [];
    const serviceUUIDs: string[] = [];
    accessory.services
      .map((service) => service as GoveeService)
      .forEach((service) => {
        stateNames.push(...service.deviceStates);
        serviceUUIDs.push(service.UUID);
      });

    return Array.from(ServiceRegistry.DeviceServiceMap.keys())
      .filter((stateName) => !stateNames.includes(stateName))
      .map((stateName) => ServiceRegistry.DeviceStateMap.get(stateName))
      .flat()
      .filter((ctor) => ctor !== undefined)
      .map((ctor) => ctor!)
      .map((ctor) => {
        if (serviceUUIDs.includes(ctor.UUID)) {
          return undefined;
        }
        let service = accessory.services.find(
          (service) => service.UUID === ctor.UUID,
        );
        if (service === undefined) {
          service = accessory.addService(new ctor(device));
          serviceUUIDs.push(service.UUID);
        }
        if (!('update' in service)) {
          accessory.removeService(service);
          service = accessory.addService(new ctor(device));
        }
        try {
          (service as unknown as { update(device): void }).update(device);
          if (
            'isPrimary' in service &&
            typeof service.isPrimary === 'boolean'
          ) {
            service.setPrimaryService(service.isPrimary);
          }
          return service;
        } catch (err) {
          this.logger.error(
            `Unable to get service ${service?.name} for ${device.id} ${device.constructor.name}`,
          );
          throw err;
        }
      })
      .filter((service) => service !== undefined)
      .map((service) => service!);
  }

  getServices(device: Device, accessory: PlatformAccessory): Service[] {
    const services: Service[] = [];
    services.push(...this.getServicesForDevice(device, accessory));
    // services.push(...this.getServicesForDeviceStates(device, accessory));
    return services;
  }
}

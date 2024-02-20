import { FactoryProvider } from '@nestjs/common';
import { DeviceServiceMap, ServiceFactoryKey } from './services.const';
import { ClassConstructor } from 'class-transformer';
import { Device } from '@constructorfleet/ultimate-govee';
import { Service } from 'homebridge';



export const ServiceFactory: FactoryProvider = {
  provide: ServiceFactoryKey,
  useFactory: () => (device: Device): Service[] | undefined =>
    (DeviceServiceMap.get(device.constructor as ClassConstructor<Device>) ?? DeviceServiceMap.get(Device))?.map((ctor) => new ctor(device))
}
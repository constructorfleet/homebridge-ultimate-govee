import { Device } from '@constructorfleet/ultimate-govee';
import { Inject } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import { Service } from 'homebridge';

export const ServiceFactoryKey = 'Service.Factory' as const;
export const InjectServiceFactory = Inject(ServiceFactoryKey);
export const DeviceServiceMap = new Map<ClassConstructor<Device>, ClassConstructor<Service>[]>()
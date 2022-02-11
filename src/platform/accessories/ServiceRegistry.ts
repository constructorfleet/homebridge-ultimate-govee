import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';
import {AccessoryService} from './services/AccessoryService';
import {Injectable} from '@nestjs/common';

export class ServiceRegistry {
  private static readonly services: Constructor<AccessoryService>[] = [];

  static getServices(): Provider {
    return {
      provide: AccessoryService,
      useValue: ServiceRegistry.services,
    };
  }

  static register<T extends Constructor<AccessoryService>>(ctor: T) {
    ServiceRegistry.services.push(ctor);

    return Injectable()(ctor);
  }
}
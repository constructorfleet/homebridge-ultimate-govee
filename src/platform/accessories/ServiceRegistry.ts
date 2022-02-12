import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';
import {AccessoryService} from './services/AccessoryService';
import {Injectable} from '@nestjs/common';
import {ModuleRef} from '@nestjs/core';

export class ServiceRegistry {
  private static readonly services: Constructor<AccessoryService>[] = [];

  static getServices(): Provider {

    return {
      provide: AccessoryService,
      useFactory: async (moduleRef: ModuleRef) =>
        await Promise.all(
          ServiceRegistry.services.map(
            (serviceCtor) => moduleRef.create(serviceCtor),
          ),
        ),
      inject: [ModuleRef],
    };
  }

  static register<T extends Constructor<AccessoryService>>(ctor: T) {
    ServiceRegistry.services.push(ctor);

    return Injectable()(ctor);
  }
}
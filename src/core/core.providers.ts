import { FactoryProvider } from '@nestjs/common';
import {
  CoreModuleOptionsKey,
  HomebridgeApiKey,
  HomebridgeServicesKey,
} from './core.const';
import { CoreModuleOptions } from './core.types';

export const HomebridgeServiceProvider: FactoryProvider = {
  provide: HomebridgeServicesKey,
  inject: [CoreModuleOptionsKey],
  useFactory: (options: CoreModuleOptions) => options.api.hap.Service,
};

export const HomebridgeCharacteristicProvider: FactoryProvider = {
  provide: HomebridgeServicesKey,
  inject: [CoreModuleOptionsKey],
  useFactory: (options: CoreModuleOptions) => options.api.hap.Characteristic,
};

export const HomebridgeApiProvider: FactoryProvider = {
  provide: HomebridgeApiKey,
  inject: [CoreModuleOptionsKey],
  useFactory: (options: CoreModuleOptions) => options.api,
};

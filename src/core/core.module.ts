import { Module } from '@nestjs/common';
import {
  HomebridgeApiProvider,
  HomebridgeCharacteristicProvider,
  HomebridgeServiceProvider,
  HomebridgeUUIDProvider,
} from './core.providers';
import { CoreModuleOptionsKey } from './core.const';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { CoreModuleOptions } from './core.types';

@Module({
  providers: [
    HomebridgeApiProvider,
    HomebridgeServiceProvider,
    HomebridgeCharacteristicProvider,
    HomebridgeUUIDProvider,
  ],
  exports: [
    HomebridgeApiProvider,
    HomebridgeServiceProvider,
    HomebridgeCharacteristicProvider,
    HomebridgeUUIDProvider,
  ],
})
export class CoreModule extends createConfigurableDynamicRootModule<
  CoreModule,
  CoreModuleOptions
>(CoreModuleOptionsKey) {
  static deferred = (ms?: number) =>
    CoreModule.externallyConfigured(CoreModule, ms ?? 0);
}

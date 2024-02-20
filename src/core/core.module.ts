import { Module } from '@nestjs/common';
import { HomebridgeCharacteristicProvider, HomebridgeServiceProvider, HomebridgeUUIDProvider } from './core.providers';
import { CoreModuleOptionsKey } from './core.const';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { CoreModuleOptions } from './core.types';

@Module({
  providers: [HomebridgeServiceProvider, HomebridgeCharacteristicProvider, HomebridgeUUIDProvider],
  exports: [HomebridgeServiceProvider, HomebridgeCharacteristicProvider, HomebridgeUUIDProvider],
})
export class CoreModule extends createConfigurableDynamicRootModule<
  CoreModule,
  CoreModuleOptions
>(CoreModuleOptionsKey) {
  static deferred = () => CoreModule.externallyConfigured(CoreModule, 0);
}

import { Module } from '@nestjs/common';
import { HomebridgeServiceProvider } from './core.providers';
import { CoreModuleOptionsKey } from './core.const';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { CoreModuleOptions } from './core.types';

@Module({
  providers: [HomebridgeServiceProvider],
  exports: [HomebridgeServiceProvider],
})
export class CoreModule extends createConfigurableDynamicRootModule<
  CoreModule,
  CoreModuleOptions
>(CoreModuleOptionsKey) {}

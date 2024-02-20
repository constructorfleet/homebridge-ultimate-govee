import { PluginConfigModuleOptionsKey } from './plugin-config.const';
import { GoveePluginConfiguration } from './plugin-config.providers';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { PluginConfigModuleOptions } from './plugin-config.types';
import { Module } from '@nestjs/common';

@Module({
  providers: [GoveePluginConfiguration],
  exports: [GoveePluginConfiguration],
})
export class PluginConfigModule extends createConfigurableDynamicRootModule<
  PluginConfigModule,
  PluginConfigModuleOptions
>(PluginConfigModuleOptionsKey) {
  static deferred = (wait: number = 0) =>
    PluginConfigModule.externallyConfigured(PluginConfigModule, wait);
}

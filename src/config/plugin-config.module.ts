import { PluginConfigModuleOptionsKey } from './plugin-config.const';
import {
  ConfigFilePathProvider,
  GoveePluginConfiguration,
} from './plugin-config.providers';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { PluginConfigModuleOptions } from './plugin-config.types';
import { Module } from '@nestjs/common';
import { PluginConfigService } from './plugin-config.service';

@Module({
  providers: [
    GoveePluginConfiguration,
    PluginConfigService,
    ConfigFilePathProvider,
  ],
  exports: [
    GoveePluginConfiguration,
    PluginConfigService,
    ConfigFilePathProvider,
  ],
})
export class PluginConfigModule extends createConfigurableDynamicRootModule<
  PluginConfigModule,
  PluginConfigModuleOptions
>(PluginConfigModuleOptionsKey) {
  static deferred = (wait: number = 0) =>
    PluginConfigModule.externallyConfigured(PluginConfigModule, wait);
}

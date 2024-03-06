import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './plugin-config.const';
import {
  ConfigFilePathProvider,
  GoveePluginConfiguration,
} from './plugin-config.providers';
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
    MODULE_OPTIONS_TOKEN,
  ],
})
export class PluginConfigModule extends ConfigurableModuleClass {}

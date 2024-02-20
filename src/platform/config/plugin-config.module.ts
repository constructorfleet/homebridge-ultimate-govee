import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './plugin-config.const';
import { GoveePluginConfiguration } from './plugin-config.providers';

@Module({
  providers: [GoveePluginConfiguration],
  exports: [GoveePluginConfiguration],
})
export class PluginConfigModule extends ConfigurableModuleClass {}

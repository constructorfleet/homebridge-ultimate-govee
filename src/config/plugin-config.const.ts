import { ConfigurableModuleBuilder } from '@nestjs/common';
import { PluginConfigModuleOptions } from './plugin-config.types';

export const GoveePluginConfigKey = 'Config.Plugin.Govee';
export const GoveePluginConfigKey$ = 'Config.Plugin.Govee$';
export const PluginConfigModuleOptionsKey = 'Options.PluginConfig';
export const DeviceConfigChangedKey = 'Config.Plugin.Govee.Device';
export const ConfigFilePathKey = 'Config.Plugin.Path';

export const PluginConfigVersion = 2 as const;

export const {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
  MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<PluginConfigModuleOptions>({
  moduleName: 'PluginConfig',
  optionsInjectionToken: PluginConfigModuleOptionsKey,
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();

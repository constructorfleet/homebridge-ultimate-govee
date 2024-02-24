import { FactoryProvider, Inject } from '@nestjs/common';
import {
  ConfigFilePathKey,
  GoveePluginConfigKey,
  MODULE_OPTIONS_TOKEN,
  PluginConfigVersion,
} from './plugin-config.const';
import { GoveePluginConfig } from './v1/plugin-config.govee';
import { plainToInstance } from 'class-transformer';
import { PartialBehaviorSubject } from '../common';
import { PluginConfigModuleOptions } from './plugin-config.types';
import { pluginConfigMigrate } from './plugin-config.migrate';

export const InjectConfig = Inject(GoveePluginConfigKey);
export const GoveePluginConfiguration: FactoryProvider = {
  provide: GoveePluginConfigKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: async (options: PluginConfigModuleOptions) => {
    const pluginConfig =
      options.config.version === PluginConfigVersion
        ? plainToInstance(GoveePluginConfig, options.config)
        : await pluginConfigMigrate(options.config, PluginConfigVersion);
    return new PartialBehaviorSubject(pluginConfig);
  },
};

export const InjectConfigFilePath = Inject(ConfigFilePathKey);
export const ConfigFilePathProvider: FactoryProvider = {
  provide: ConfigFilePathKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: PluginConfigModuleOptions) => options.path,
};

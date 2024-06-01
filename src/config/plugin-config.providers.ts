import { FactoryProvider, Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ConfigFilePathKey,
  GoveePluginConfigKey,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  PluginConfigVersion,
} from './plugin-config.const';
import { pluginConfigMigrate } from './plugin-config.migrate';
import { GoveePluginConfig } from './v2/plugin-config.govee';

export const InjectConfig = Inject(GoveePluginConfigKey);
export const GoveePluginConfiguration: FactoryProvider = {
  provide: GoveePluginConfigKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: async (options: typeof OPTIONS_TYPE) =>
    options.config.version === PluginConfigVersion
      ? plainToInstance(GoveePluginConfig, options.config)
      : await pluginConfigMigrate(options.config, PluginConfigVersion),
};

export const InjectConfigFilePath = Inject(ConfigFilePathKey);
export const ConfigFilePathProvider: FactoryProvider = {
  provide: ConfigFilePathKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: typeof OPTIONS_TYPE) => options.path,
};

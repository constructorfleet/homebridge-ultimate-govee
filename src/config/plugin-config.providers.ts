import { FactoryProvider, Inject } from '@nestjs/common';
import {
  ConfigFilePathKey,
  GoveePluginConfigKey$,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  PluginConfigVersion,
} from './plugin-config.const';
import { GoveePluginConfig } from './v1/plugin-config.govee';
import { plainToInstance } from 'class-transformer';
import { pluginConfigMigrate } from './plugin-config.migrate';

export const InjectConfig = Inject(GoveePluginConfigKey$);
export const GoveePluginConfiguration: FactoryProvider = {
  provide: GoveePluginConfigKey$,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: async (options: typeof OPTIONS_TYPE) => {
    return options.config.version === PluginConfigVersion
      ? plainToInstance(GoveePluginConfig, options.config)
      : await pluginConfigMigrate(options.config, PluginConfigVersion);
  },
};

export const InjectConfigFilePath = Inject(ConfigFilePathKey);
export const ConfigFilePathProvider: FactoryProvider = {
  provide: ConfigFilePathKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: typeof OPTIONS_TYPE) => options.path,
};

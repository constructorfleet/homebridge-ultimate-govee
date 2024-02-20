import { GoveePluginConfig } from './v1/plugin-config.govee';

export const pluginConfigMigrate = async (
  config,
  version: number,
): Promise<GoveePluginConfig | undefined> => {
  let fromVersion = config.version ?? 1;
  let pluginConfig: GoveePluginConfig | undefined = undefined;
  while (fromVersion < version) {
    const migrate = await import(`./v${fromVersion}/migrate.config`);
    pluginConfig = migrate.pluginConfigMigrate(config);
    fromVersion++;
  }

  return pluginConfig;
};

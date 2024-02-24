import { GoveePluginConfig } from './v1/plugin-config.govee';

export const pluginConfigMigrate = async (
  config,
  version: number,
): Promise<GoveePluginConfig | undefined> => {
  let fromVersion = config.version ?? 2;
  let pluginConfig: GoveePluginConfig | undefined = undefined;
  while (fromVersion <= version) {
    const migrate = await import(`./v${fromVersion}/migrate.config`);
    console.dir(migrate.migrateConfig);
    pluginConfig = migrate.migrateConfig(config);
    fromVersion++;
  }

  return pluginConfig;
};

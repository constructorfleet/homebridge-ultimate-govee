import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CONFIG_FILE} from '../../util/const';
import fs from 'fs';
import {PLATFORM_NAME} from '../../settings';
import {GoveeDeviceOverride, GoveeDeviceOverrides, GoveePluginConfig} from './GoveePluginConfig';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {GoveeHumidifier} from '../../devices/GoveeHumidifier';
import {GoveeAirPurifier} from '../../devices/GoveeAirPurifier';

@Injectable()
export class PlatformConfigService {
  private readonly goveePluginConfig: GoveePluginConfig;

  constructor(
    @Inject(PLATFORM_CONFIG_FILE) private readonly configFilePath: string,
  ) {
    this.goveePluginConfig = this.pluginConfiguration;
  }

  private get deviceOverridesById(): Map<string, GoveeDeviceOverride> {
    const deviceMap = new Map<string, GoveeDeviceOverride>();
    this.goveePluginConfig?.devices?.humidifiers?.forEach(
      (deviceOverride) => deviceMap.set(
        deviceOverride.deviceId!,
        deviceOverride,
      ),
    );
    this.goveePluginConfig?.devices?.airPurifiers?.forEach(
      (deviceOverride) => deviceMap.set(
        deviceOverride.deviceId!,
        deviceOverride,
      ),
    );

    return deviceMap;
  }

  get pluginConfiguration(): GoveePluginConfig {
    const data = fs.readFileSync(this.configFilePath, {encoding: 'utf8'});
    const config = JSON.parse(data);
    if (!config.platforms) {
      return new GoveePluginConfig();
    }

    const platformConfig = config.platforms.find(
      (platformConfig) =>
        platformConfig.platform === PLATFORM_NAME,
    );
    if (!platformConfig) {
      return new GoveePluginConfig();
    }
    return platformConfig;
  }

  updateConfigurationWithDevices(
    ...devices: GoveeDevice[]
  ) {
    const configFile = this.configurationFile(
      this.buildGoveePluginConfiguration(
        this.goveePluginConfig,
        ...devices,
      ),
    );

    fs.writeFileSync(
      this.configFilePath,
      JSON.stringify(configFile, null, 2),
      {encoding: 'utf8'},
    );
  }

  private configurationFile(updatedPluginConfig?: GoveePluginConfig): unknown {
    const data = fs.readFileSync(this.configFilePath, {encoding: 'utf8'});
    let config = JSON.parse(data);
    if (!config.platforms) {
      config = {
        platforms: [
          new GoveePluginConfig(),
        ],
      };
    }

    const platforms: Record<string, never>[] = [];
    config.platforms.forEach(
      (platformConfig) =>
        (platformConfig.platform === PLATFORM_NAME)
          ? platforms.push(updatedPluginConfig || platformConfig)
          : platforms.push(platformConfig),
    );

    config.platforms = platforms;

    return config;
  }

  private buildGoveePluginConfiguration(
    config: GoveePluginConfig,
    ...devices: GoveeDevice[]
  ): GoveePluginConfig {
    config.devices = this.buildGoveeDeviceOverrides(
      config,
      ...devices,
    );

    return config;
  }

  private buildGoveeDeviceOverrides(
    config: GoveePluginConfig,
    ...devices: GoveeDevice[]
  ): GoveeDeviceOverrides {
    const deviceMap = this.deviceOverridesById;
    const newHumidifiers: GoveeDeviceOverride[] =
      devices
        .filter(
          (device) =>
            !deviceMap.has(device.deviceId) && device instanceof GoveeHumidifier,
        )
        .map((device) => new GoveeDeviceOverride(device));
    const newPurifiers: GoveeDeviceOverride[] =
      devices
        .filter(
          (device) =>
            !deviceMap.has(device.deviceId) && device instanceof GoveeAirPurifier,
        )
        .map((device) => new GoveeDeviceOverride(device));

    return new GoveeDeviceOverrides(
      (config.devices?.humidifiers || []).concat(...newHumidifiers),
      (config?.devices?.airPurifiers || []).concat(...newPurifiers),
    );
  }
}
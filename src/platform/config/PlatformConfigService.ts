import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CONFIG_FILE} from '../../util/const';
import fs from 'fs';
import {PLATFORM_NAME} from '../../settings';
import {
  GoveeDeviceOverride,
  GoveeDeviceOverrides,
  GoveeLightOverride,
  GoveePluginConfig,
  GoveeRGBICLightOverride,
} from './GoveePluginConfig';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {GoveeHumidifier} from '../../devices/implementations/GoveeHumidifier';
import {GoveeAirPurifier} from '../../devices/implementations/GoveeAirPurifier';
import {GoveeLight, LightDevice} from '../../devices/implementations/GoveeLight';
import {GoveeRGBICLight} from '../../devices/implementations/GoveeRGBICLight';
import {DeviceLightEffect} from '../../effects/implementations/DeviceLightEffect';
import {DIYLightEffect} from '../../effects/implementations/DIYLightEffect';
import {Lock} from 'async-await-mutex-lock';

@Injectable()
export class PlatformConfigService {
  private goveePluginConfig: GoveePluginConfig = new GoveePluginConfig;
  private readonly writeLock: Lock<void> = new Lock<void>();

  constructor(
    @Inject(PLATFORM_CONFIG_FILE) private readonly configFilePath: string,
  ) {
    this.reloadConfig().then();
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
    this.goveePluginConfig?.devices?.lights?.forEach(
      (deviceOverride) => deviceMap.set(
        deviceOverride.deviceId!,
        deviceOverride,
      ),
    );

    return deviceMap;
  }

  get pluginConfiguration(): GoveePluginConfig {
    return this.goveePluginConfig;
  }

  private async reloadConfig() {
    await this.writeLock.acquire();
    try {
      const data = fs.readFileSync(this.configFilePath, {encoding: 'utf8'});
      const config = JSON.parse(data);
      if (!config.platforms) {
        return;
      }

      const platformConfig = config.platforms.find(
        (platformConfig) =>
          platformConfig.platform === PLATFORM_NAME,
      );
      if (!platformConfig) {
        return;
      }
      this.goveePluginConfig = platformConfig;
      setTimeout(
        async () => await this.reloadConfig(),
        30 * 1000,
      );
    } finally {
      this.writeLock.release();
    }
  }

  getDeviceConfiguration<OverrideType extends GoveeDeviceOverride>(
    deviceId: string,
  ): OverrideType | undefined {
    const deviceConfigurations: GoveeDeviceOverride[] =
      new Array<GoveeDeviceOverride>(
        ...(this.pluginConfiguration.devices?.humidifiers || []),
        ...(this.pluginConfiguration.devices?.airPurifiers || []),
        ...(this.pluginConfiguration.devices?.lights || []),
      );
    return deviceConfigurations.find(
      (deviceConfig) => deviceConfig.deviceId === deviceId,
    ) as OverrideType;
  }

  async updateConfigurationWithEffects(
    diyEffects?: DIYLightEffect[],
    deviceEffects?: DeviceLightEffect[],
  ) {
    await this.writeLock.acquire();
    try {
      const configFile = this.configurationFile(
        this.buildGoveePluginConfigurationFromEffects(
          this.goveePluginConfig,
          diyEffects,
          deviceEffects,
        ),
      );

      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configFile, null, 2),
        {encoding: 'utf8'},
      );
    } finally {
      this.writeLock.release();
    }
  }

  async updateConfigurationWithDevices(
    ...devices: GoveeDevice[]
  ) {
    await this.writeLock.acquire();
    try {
      const configFile = this.configurationFile(
        this.buildGoveePluginConfigurationFromDevices(
          this.goveePluginConfig,
          ...devices,
        ),
      );

      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configFile, null, 2),
        {encoding: 'utf8'},
      );
    } finally {
      this.writeLock.release();
    }
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

  private buildGoveePluginConfigurationFromDevices(
    config: GoveePluginConfig,
    ...devices: GoveeDevice[]
  ): GoveePluginConfig {
    config.devices = this.buildGoveeDeviceOverrides(
      config,
      ...devices,
    );

    return config;
  }

  private buildGoveePluginConfigurationFromEffects(
    config: GoveePluginConfig,
    diyEffects?: DIYLightEffect[],
    deviceEffects?: DeviceLightEffect[],
  ): GoveePluginConfig {
    if (diyEffects) {
      config.devices = this.buildGoveeDIYEffectOverrides(
        config,
        ...diyEffects,
      );
    }
    if (deviceEffects) {
      config.devices = this.buildGoveeDeviceEffectOverrides(
        config,
        ...deviceEffects,
      );
    }

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
    const newLights: GoveeDeviceOverride[] =
      devices
        .filter(
          (device) =>
            !deviceMap.has(device.deviceId) && (device instanceof LightDevice),
        )
        .map((device) =>
          device instanceof GoveeRGBICLight
            ? new GoveeRGBICLightOverride(device as GoveeRGBICLight)
            : new GoveeLightOverride(device as GoveeLight),
        );

    return new GoveeDeviceOverrides(
      (config.devices?.humidifiers || []).concat(...newHumidifiers),
      (config?.devices?.airPurifiers || []).concat(...newPurifiers),
      (config?.devices?.lights || []).concat(...newLights),
    );
  }

  private buildGoveeDeviceEffectOverrides(
    config: GoveePluginConfig,
    ...deviceEffects: DeviceLightEffect[]
  ): GoveeDeviceOverrides {
    const lightOverrides: GoveeLightOverride[] =
      ((config?.devices?.lights || []) as GoveeLightOverride[]);

    lightOverrides.forEach(
      (override: GoveeLightOverride) => {
        const effects = deviceEffects.filter(
          (effect: DeviceLightEffect) => effect.deviceId === override.deviceId,
        );
        if (!effects || effects.length === 0) {
          return;
        }
        const knownEffects = override.effects?.map((effect) => `${effect.id}_${effect.name}`) || [];
        if (!override.effects) {
          override.effects = [];
        }
        override.effects?.push(...effects.filter((effect) => !knownEffects.includes(`${effect.id}_${effect.name}`)));
      },
    );

    return new GoveeDeviceOverrides(
      (config.devices?.humidifiers || []),
      (config?.devices?.airPurifiers || []),
      lightOverrides,
    );
  }

  private buildGoveeDIYEffectOverrides(
    config: GoveePluginConfig,
    ...diyEffects: DIYLightEffect[]
  ): GoveeDeviceOverrides {
    const lightOverrides: GoveeLightOverride[] =
      ((config?.devices?.lights || []) as GoveeLightOverride[]);

    lightOverrides.forEach(
      (override: GoveeLightOverride) => {
        override.diyEffects = diyEffects;
      },
    );

    return new GoveeDeviceOverrides(
      (config.devices?.humidifiers || []),
      (config?.devices?.airPurifiers || []),
      lightOverrides,
    );
  }
}
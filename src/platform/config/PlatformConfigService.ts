import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { dirname, join } from 'path';
import { PLATFORM_CONFIG_FILE } from '../../util/const';
import fs, { WatchEventType } from 'fs';
import { PLATFORM_NAME } from '../../settings';
import {
  GoveeDeviceOverride,
  GoveeDeviceOverrides,
  GoveeLightOverride,
  GoveePluginConfig,
  GoveeRGBICLightOverride,
} from './GoveePluginConfig';
import { GoveeDevice } from '../../devices/GoveeDevice';
import { GoveeHumidifier } from '../../devices/implementations/GoveeHumidifier';
import { GoveeAirPurifier } from '../../devices/implementations/GoveeAirPurifier';
import { GoveeLight, LightDevice } from '../../devices/implementations/GoveeLight';
import { GoveeRGBICLight } from '../../devices/implementations/GoveeRGBICLight';
import { DeviceLightEffect } from '../../effects/implementations/DeviceLightEffect';
import { DIYLightEffect } from '../../effects/implementations/DIYLightEffect';
import { Lock } from 'async-await-mutex-lock';
import { LoggingService } from '../../logging/LoggingService';
import { GoveeRGBLight } from '../../devices/implementations/GoveeRGBLight';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformConfigurationReloaded } from './events/PluginConfiguration';
import { Emitter } from '../../util/types';

@Injectable()
export class PlatformConfigService extends Emitter implements OnModuleInit, OnModuleDestroy {
  private goveePluginConfig: GoveePluginConfig = new GoveePluginConfig;
  private readonly writeLock: Lock<void> = new Lock<void>();
  private debouncer?: NodeJS.Timeout = undefined;
  private fsWatcher?: fs.FSWatcher = undefined;

  constructor(
    @Inject(PLATFORM_CONFIG_FILE) private readonly configFilePath: string,
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    this.reloadConfig().then();
  }

  async onModuleDestroy() {
    this.log.info('Unwatching', this.configDirectory);
    if(this.fsWatcher) {
      this.fsWatcher.close();
    }
    if(this.debouncer) {
      clearTimeout(this.debouncer);
    }
    this.fsWatcher = undefined;
    this.debouncer = undefined;
  }

  async onModuleInit() {
    this.log.info('Watching', this.configDirectory);
    this.fsWatcher = fs.watch(this.configDirectory, {persistent: true}, async (event: WatchEventType, filename) => {
      this.log.info(
        this.configDirectory,
        this.configFilePath,
        filename,
        event
      );
      if (this.configFilePath !== join(this.configDirectory, filename)) {
        return;
      }
      this.log.info(event, filename);
      if (this.debouncer) {
        clearTimeout(this.debouncer);
      }
      this.log.info('Debouncing...');
      this.debouncer = setTimeout(async () => await this.reloadConfig(), 1000);
    });
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

  get configDirectory(): string {
    return dirname(fs.realpathSync(this.configFilePath));
  }

  get pluginConfiguration(): GoveePluginConfig {
    return this.goveePluginConfig;
  }

  public hasFeatureFlag(featureFlag: string): boolean {
    return (this.goveePluginConfig.featureFlags)?.includes(featureFlag);
  }

  private async reloadConfig() {
    this.log.info('Will reload config...');
    await this.writeLock.acquire();
    this.log.info('Reloading!');
    const before: GoveePluginConfig | undefined = this.goveePluginConfig;
    let after: GoveePluginConfig | undefined = undefined;
    try {
      const data = fs.readFileSync(this.configFilePath, { encoding: 'utf8' });
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
      after = platformConfig;
      this.goveePluginConfig = platformConfig;
      this.goveePluginConfig.featureFlags =
        this.goveePluginConfig.featureFlags || [] as string[];

      // setTimeout(
      //   async () => await this.reloadConfig(),
      //   10 * 1000,
      // );
    } finally {
      this.writeLock.release();
    }

    if (before && after) {
      await this.emitAsync(
        new PlatformConfigurationReloaded({ before, after }),
      );
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

  async addFeatureFlags(
    ...featureFlags: string[]
  ) {
    await this.writeLock.acquire();
    try {
      this.goveePluginConfig.featureFlags =
        [
          ...new Set(
            (this.goveePluginConfig.featureFlags || []).concat(...featureFlags),
          ),
        ];
      const configFile = this.configurationFile(this.goveePluginConfig);
      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configFile, null, 2),
        { encoding: 'utf8' },
      );
    } finally {
      this.writeLock.release();
    }
  }

  async removeFeatureFlags(
    ...featureFlags: string[]
  ) {
    await this.writeLock.acquire();
    try {
      this.goveePluginConfig.featureFlags =
        [
          ...new Set(
            this.goveePluginConfig.featureFlags.filter(
              (flag: string) => !featureFlags.includes(flag),
            ),
          ),
        ];
      const configFile = this.configurationFile(
        this.goveePluginConfig,
      );
      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configFile, null, 2),
        { encoding: 'utf8' },
      );
    } finally {
      this.writeLock.release();
    }
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
          false,
          diyEffects,
          deviceEffects,
        ),
      );

      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configFile, null, 2),
        { encoding: 'utf8' },
      );
    } finally {
      this.writeLock.release();
    }
  }

  async setConfigurationEffects(
    diyEffects?: DIYLightEffect[],
    deviceEffects?: DeviceLightEffect[],
  ) {
    await this.writeLock.acquire();
    try {
      const configFile = this.configurationFile(
        this.buildGoveePluginConfigurationFromEffects(
          this.goveePluginConfig,
          true,
          diyEffects,
          deviceEffects,
        ),
      );

      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configFile, null, 2),
        { encoding: 'utf8' },
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
        { encoding: 'utf8' },
      );
    } finally {
      this.writeLock.release();
    }
  }

  private configurationFile(updatedPluginConfig?: GoveePluginConfig): unknown {
    const data = fs.readFileSync(this.configFilePath, { encoding: 'utf8' });
    const config = JSON.parse(data);
    if (!config.platforms) {
      config.platforms = [
        new GoveePluginConfig(),
      ];
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
    overwrite: boolean,
    diyEffects?: DIYLightEffect[],
    deviceEffects?: DeviceLightEffect[],
  ): GoveePluginConfig {
    if (diyEffects !== null && diyEffects !== undefined) {
      config.devices = this.buildGoveeDIYEffectOverrides(
        config,
        ...diyEffects,
      );
    }
    if (deviceEffects !== null && deviceEffects !== undefined) {
      config.devices = this.buildGoveeDeviceEffectOverrides(
        config,
        overwrite,
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
      devices.filter(
        (device) =>
          !deviceMap.has(device.deviceId) && device instanceof GoveeHumidifier,
      ).map((device) => new GoveeDeviceOverride(device));
    const newPurifiers: GoveeDeviceOverride[] =
      devices.filter(
        (device) =>
          !deviceMap.has(device.deviceId) && device instanceof GoveeAirPurifier,
      ).map((device) => new GoveeDeviceOverride(device));
    const newLights: GoveeDeviceOverride[] =
      devices.filter(
        (device) =>
          !deviceMap.has(device.deviceId) && (
            device instanceof LightDevice
            || device instanceof GoveeRGBICLight
            || device instanceof GoveeRGBLight),
      ).map((device) =>
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
    overwrite: boolean,
    ...deviceEffects: DeviceLightEffect[]
  ): GoveeDeviceOverrides {
    const lightOverrides: GoveeLightOverride[] =
      ((config?.devices?.lights || []) as GoveeLightOverride[]);

    lightOverrides.forEach(
      (override: GoveeLightOverride) => {
        if (overwrite) {
          override.effects = deviceEffects;
          return;
        }
        const effects = deviceEffects.filter(
          (effect: DeviceLightEffect) => effect.deviceId === override.deviceId,
        ).map(
          (effect: DeviceLightEffect) => {
            if (override.effects !== undefined) {
              const existing = override.effects.find(
                (x) => x.name === effect.name,
              );
              if (existing) {
                const existingIndex = override.effects.indexOf(existing);
                effect.enabled = existing.enabled;
                override.effects?.splice(existingIndex, 1);
              }
            }
            return effect;
          },
        );
        if (!effects || effects.length === 0) {
          return;
        }
        if (!override.effects) {
          override.effects = [];
        }
        override.effects?.push(
          ...effects,
        );
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
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { dirname, join } from 'path';
import { PLATFORM_NAME } from '../settings';
import { GoveePluginConfig, configFromDevice } from './v2/plugin-config.govee';
import { Lock } from 'async-await-mutex-lock';
import { InjectConfig, InjectConfigFilePath } from './plugin-config.providers';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { readFile, writeFile } from 'fs/promises';
import {
  Device,
  DeviceStatesType,
  LightEffectState,
  LightEffectStateName,
  PartialBehaviorSubject,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { FSWatcher, existsSync, realpathSync, watch } from 'fs';
import { Subscription } from 'rxjs';
import { LightEffectConfig, RGBLightDeviceConfig } from './v2/devices';
import { ConfigType, PluginConfig } from './plugin-config.types';

@Injectable()
export class PluginConfigService implements OnModuleDestroy {
  private readonly logger: Logger = new Logger(PluginConfigService.name);
  private readonly configFilePath: string;
  private readonly configDirectory: string;
  private readonly fileLock: Lock<void> = new Lock<void>();
  private readonly deviceConfigs: Map<
    string,
    PartialBehaviorSubject<ConfigType<any>>
  >;
  private config: GoveePluginConfig;
  private readonly subscriptions: Subscription[] = [];
  private debouncer?: NodeJS.Timeout = undefined;
  private fsWatcher?: FSWatcher = undefined;
  private interval?: NodeJS.Timeout;

  get pluginConfig(): GoveePluginConfig {
    return this.config;
  }

  constructor(
    @InjectConfigFilePath configFilePath: string,
    @InjectConfig
    pluginConfig: GoveePluginConfig,
  ) {
    this.config = pluginConfig;
    this.configFilePath = realpathSync(configFilePath);
    this.configDirectory = dirname(realpathSync(this.configFilePath));
    this.deviceConfigs = new Map();
    this.watchForChanges();
  }

  onModuleDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.pauseWriteInterval();
    this.stopWatching();
  }

  pauseWriteInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = undefined;
  }

  resumeWriteInterval() {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(
      async () => await this.writeConfig(),
      60 * 1000,
    );
  }

  stopWatching() {
    this.logger.log('Stop watching for changes');
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = undefined;
    }
    if (this.debouncer) {
      clearTimeout(this.debouncer);
      this.debouncer = undefined;
    }
  }

  watchForChanges() {
    if (this.fsWatcher !== undefined) {
      return;
    }
    this.logger.log('Watching for changes');
    this.fsWatcher = watch(
      this.configDirectory,
      { persistent: true },
      (_, filename) => {
        if (
          this.configFilePath !== join(this.configDirectory, filename || '') ||
          !existsSync(this.configFilePath)
        ) {
          return;
        }

        if (this.debouncer) {
          clearTimeout(this.debouncer);
        }
        this.debouncer = setTimeout(() => this.reloadConfig(), 10000);
      },
    );
  }

  private async reloadConfig(): Promise<PluginConfig | undefined> {
    this.stopWatching();
    await this.fileLock.acquire();
    this.logger.log('RELOADING CONFIG');
    try {
      const data = await readFile(this.configFilePath, { encoding: 'utf8' });
      const config = JSON.parse(data);
      if (!config.platforms) {
        return;
      }

      const pluginConfig = config.platforms.find(
        (platformConfig) => platformConfig.platform === PLATFORM_NAME,
      );
      if (pluginConfig === undefined) {
        return;
      }
      const goveeConfig = plainToInstance(GoveePluginConfig, pluginConfig);
      if (goveeConfig.controlChannels.ble !== this.config.controlChannels.ble) {
        this.config.controlChannels.ble = goveeConfig.controlChannels.ble;
      }
      if (goveeConfig.controlChannels.iot !== this.config.controlChannels.iot) {
        this.config.controlChannels.iot = goveeConfig.controlChannels.iot;
      }
      if (
        goveeConfig.credentials.username !== this.config.credentials.username
      ) {
        this.config.credentials.username = goveeConfig.credentials.username;
      }
      if (
        goveeConfig.credentials.password !== this.config.credentials.password
      ) {
        this.config.credentials.password = goveeConfig.credentials.password;
      }
      goveeConfig.deviceConfigs.forEach((newDeviceConfig) => {
        this.deviceConfigs.get(newDeviceConfig.id)?.next(newDeviceConfig);
        const index = this.config.deviceConfigs.findIndex(
          (dc) => dc.id === newDeviceConfig.id,
        );
        if (index < 0) {
          this.config.deviceConfigs.push(newDeviceConfig);
        } else {
          this.config.deviceConfigs[index] = newDeviceConfig;
        }
      });
    } finally {
      this.watchForChanges();
      this.fileLock.release();
    }
  }

  private async writeConfig() {
    this.pauseWriteInterval();
    await this.fileLock.acquire();
    this.stopWatching();
    this.logger.log('WRITING CONFIG');
    try {
      const data = await readFile(this.configFilePath, { encoding: 'utf8' });
      const config = JSON.parse(data);
      if (!config.platforms) {
        return;
      }

      const pluginConfig = instanceToPlain(this.config) as PluginConfig;
      const index = config.platforms.findIndex(
        (platformConfig) => platformConfig.platform === PLATFORM_NAME,
      );
      if (index < 0) {
        config.platforms.push(pluginConfig);
      } else {
        config.platforms[index] = pluginConfig;
      }
      await writeFile(this.configFilePath, JSON.stringify(config, null, 2));
    } finally {
      this.watchForChanges();
      this.fileLock.release();
    }
  }

  getDeviceConfiguration<
    States extends DeviceStatesType,
    T extends Device<States>,
  >(device: T): PartialBehaviorSubject<ConfigType<States>> {
    if (!this.deviceConfigs.has(device.id)) {
      const config =
        this.config.deviceConfigs.find((c) => c.id === device.id) ??
        configFromDevice<States, T>(device);
      if (device instanceof RGBLightDevice) {
        const existingCodes = (config as RGBLightDeviceConfig).effects.map(
          (e) => e.code,
        );
        const effectSub =
          device.state<LightEffectState>(LightEffectStateName)?.effects;
        Array.from(effectSub?.values() ?? []).forEach((effect) => {
          if (effect.code === undefined || effect.name === undefined) {
            return;
          }
          if (!existingCodes.includes(effect.code)) {
            const lightConfig = new LightEffectConfig();
            lightConfig.code = effect.code;
            lightConfig.name = effect.name;
            lightConfig.description = '';
            lightConfig.enabled = false;
            (config as RGBLightDeviceConfig).effects.push(lightConfig);
          }
        });
        this.resumeWriteInterval();
        effectSub?.delta$?.subscribe(() => this.resumeWriteInterval());
      }
      this.deviceConfigs.set(device.id, new PartialBehaviorSubject(config));
    }

    return this.deviceConfigs.get(device.id)! as PartialBehaviorSubject<
      ConfigType<States>
    >;
  }
}

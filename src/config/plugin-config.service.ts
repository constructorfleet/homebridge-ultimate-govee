import {
  DeltaMap,
  Device,
  DeviceStatesType,
  PartialBehaviorSubject,
} from '@constructorfleet/ultimate-govee';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Lock } from 'async-await-mutex-lock';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { FSWatcher, existsSync, realpathSync, watch } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Subscription } from 'rxjs';
import {
  DiyEffectDiscoveredEvent,
  DiyEffectRemovedEvent,
  LightEffectDiscoveredEvent,
  LightEffectRemovedEvent,
} from '../events';
import { PLATFORM_NAME } from '../settings';
import { InjectConfig, InjectConfigFilePath } from './plugin-config.providers';
import { ConfigType, PluginConfig } from './plugin-config.types';
import {
  DiyEffectConfig,
  LightEffectConfig,
  RGBLightDeviceConfig,
} from './v2/devices';
import { GoveePluginConfig, configFromDevice } from './v2/plugin-config.govee';

@Injectable()
export class PluginConfigService implements OnModuleDestroy {
  private readonly logger: Logger = new Logger(PluginConfigService.name);
  private readonly configFilePath: string;
  private readonly configDirectory: string;
  private readonly fileLock: Lock<void> = new Lock<void>();
  private readonly configLock: Lock<void> = new Lock<void>();
  private readonly deviceConfigs: DeltaMap<
    string,
    PartialBehaviorSubject<ConfigType<DeviceStatesType>>
  > = new DeltaMap();
  private readonly subscriptions: Subscription[] = [];
  private debouncer?: NodeJS.Timeout = undefined;
  private fsWatcher?: FSWatcher = undefined;
  private interval?: NodeJS.Timeout;

  get pluginConfig(): GoveePluginConfig {
    return this.config;
  }

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectConfigFilePath configFilePath: string,
    @InjectConfig
    private readonly config: GoveePluginConfig,
  ) {
    Object.entries(config.deviceConfigs).forEach(([id, deviceConfig]) => {
      const configSubject = new PartialBehaviorSubject(deviceConfig);
      configSubject.subscribe((config) =>
        this.deviceConfigs.set(config.id, configSubject),
      );
      this.deviceConfigs.set(id, configSubject);
    });
    this.deviceConfigs.delta$.subscribe(
      () =>
        (this.config.deviceConfigs = Object.fromEntries(
          Array.from(this.deviceConfigs.values())
            .map((cfg) => cfg.value)
            .map((cfg) => [cfg.id, cfg]),
        )),
    );
    this.configFilePath = realpathSync(configFilePath);
    this.configDirectory = dirname(realpathSync(this.configFilePath));
    this.watchForChanges();
  }

  @OnEvent(LightEffectDiscoveredEvent.name, {
    async: true,
    nextTick: true,
  })
  async onLightEffectDiscovered(
    event: LightEffectDiscoveredEvent<DeviceStatesType>,
  ) {
    if (event.effect.code === undefined || event.effect.name === undefined) {
      return;
    }
    await this.configLock.acquire();
    try {
      const deviceConfig: PartialBehaviorSubject<RGBLightDeviceConfig> =
        (this.deviceConfigs.get(event.device.id) ??
          this.getDeviceConfiguration(
            event.device,
          )) as unknown as PartialBehaviorSubject<RGBLightDeviceConfig>;
      const effects: Map<number, LightEffectConfig> =
        deviceConfig.value.effects ?? new Map();
      if (!effects.has(event.effect.code)) {
        effects.set(event.effect.code, LightEffectConfig.from(event.effect)!);
        deviceConfig.partialNext({
          effects,
        });
        this.resumeWriteInterval();
      }
    } finally {
      this.configLock.release();
    }
  }

  @OnEvent(LightEffectRemovedEvent.name, {
    async: true,
    nextTick: true,
  })
  async onLightEffectRemoved(event: LightEffectRemovedEvent<DeviceStatesType>) {
    if (event.effect.code === undefined) {
      return;
    }
    await this.configLock.acquire();
    try {
      const deviceConfig: PartialBehaviorSubject<RGBLightDeviceConfig> =
        (this.deviceConfigs.get(event.device.id) ??
          this.getDeviceConfiguration(
            event.device,
          )) as unknown as PartialBehaviorSubject<RGBLightDeviceConfig>;
      const effects: Map<number, DiyEffectConfig> =
        deviceConfig.value.effects ?? new Map();
      if (effects.has(event.effect.code)) {
        effects.delete(event.effect.code);
        deviceConfig.partialNext({
          effects: effects,
        });
        this.resumeWriteInterval();
      }
    } finally {
      this.configLock.release();
    }
  }

  @OnEvent(DiyEffectDiscoveredEvent.name, {
    async: true,
    nextTick: true,
  })
  async onDiyEffectDiscovered(
    event: DiyEffectDiscoveredEvent<DeviceStatesType>,
  ) {
    if (event.effect.code === undefined || event.effect.name === undefined) {
      return;
    }
    await this.configLock.acquire();
    try {
      const deviceConfig: PartialBehaviorSubject<RGBLightDeviceConfig> =
        (this.deviceConfigs.get(event.device.id) ??
          this.getDeviceConfiguration(
            event.device,
          )) as unknown as PartialBehaviorSubject<RGBLightDeviceConfig>;
      const diy: Map<number, DiyEffectConfig> =
        deviceConfig.value.diy ?? new Map();
      if (!diy.has(event.effect.code)) {
        diy.set(event.effect.code, DiyEffectConfig.from(event.effect)!);
        deviceConfig.partialNext({
          diy,
        });
        this.resumeWriteInterval();
      }
    } finally {
      this.configLock.release();
    }
  }

  @OnEvent(DiyEffectRemovedEvent.name, {
    async: true,
    nextTick: true,
  })
  async onDiyEffectRemoved(event: DiyEffectRemovedEvent<DeviceStatesType>) {
    if (event.effect.code === undefined) {
      return;
    }
    await this.configLock.acquire();
    try {
      const deviceConfig: PartialBehaviorSubject<RGBLightDeviceConfig> =
        (this.deviceConfigs.get(event.device.id) ??
          this.getDeviceConfiguration(
            event.device,
          )) as unknown as PartialBehaviorSubject<RGBLightDeviceConfig>;
      const diy: Map<number, DiyEffectConfig> =
        deviceConfig.value.diy ?? new Map();
      if (!diy.has(event.effect.code)) {
        diy.set(event.effect.code, DiyEffectConfig.from(event.effect)!);
        deviceConfig.partialNext({
          diy,
        });
        this.resumeWriteInterval();
      }
    } finally {
      this.configLock.release();
    }
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
      10 * 1000,
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
      if (this.config.controlChannels.ble !== goveeConfig.controlChannels.ble) {
        this.config.controlChannels.ble = goveeConfig.controlChannels.ble;
      }
      if (this.config.controlChannels.iot !== goveeConfig.controlChannels.iot) {
        this.config.controlChannels.iot = goveeConfig.controlChannels.iot;
      }
      if (
        this.config.credentials.username !== goveeConfig.credentials.username
      ) {
        this.config.credentials.username = goveeConfig.credentials.username;
      }
      if (
        this.config.credentials.password !== goveeConfig.credentials.password
      ) {
        this.config.credentials.password = goveeConfig.credentials.password;
      }
      Object.entries(goveeConfig.deviceConfigs).forEach(
        ([deviceId, newDeviceConfig]) => {
          if (this.deviceConfigs.has(deviceId)) {
            this.deviceConfigs.get(deviceId)?.next(newDeviceConfig);
          } else {
            this.deviceConfigs.set(
              deviceId,
              new PartialBehaviorSubject(newDeviceConfig),
            );
          }
        },
      );

      this.config.deviceConfigs = Object.fromEntries(
        Array.from(this.deviceConfigs.values())
          .map((cfg) => cfg.value)
          .map((cfg) => [cfg.id, cfg]),
      );
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
      this.config.deviceConfigs = Object.fromEntries(
        Array.from(this.deviceConfigs.values())
          .map((cfg) => cfg.value)
          .map((cfg) => [cfg.id, cfg]),
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
      const config = new PartialBehaviorSubject(
        configFromDevice<States, T>(device, this.eventEmitter),
      );
      this.deviceConfigs.set(device.id, config);

      this.resumeWriteInterval();
    }

    const config = this.deviceConfigs.get(device.id)! as PartialBehaviorSubject<
      ConfigType<States>
    >;
    return config;
  }
}

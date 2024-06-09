import {
  Device,
  DeviceStatesType,
  DiyModeState,
  DiyModeStateName,
  LightEffectState,
  LightEffectStateName,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Lock } from 'async-await-mutex-lock';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { FSWatcher, existsSync, realpathSync, watch } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Subscription } from 'rxjs';
import { using } from '../common';
import {
  AddDiyEffectEvent,
  AddLightEffectEvent,
  DebugDeviceChangedEvent,
  DeviceConfigUpdatedEvent,
  DiyEffectChangedEvent,
  DiyEffectDiscoveredEvent,
  DiyEffectRemovedEvent,
  ExposeDiyEffectChangedEvent,
  ExposeLightEffectChangedEvent,
  ExposePreviousDeviceChanged,
  IgnoreDeviceChangedEvent,
  LightEffectChangedEvent,
  LightEffectDiscoveredEvent,
  LightEffectRemovedEvent,
  NameDeviceChangedEvent,
  NameDiyEffectChangedEvent,
  NameLightEffectChangedEvent,
  RemoveDiyEffectEvent,
  RemoveLightEffectEvent,
} from '../events';
import { BaseEvent } from '../events/base.event';
import { PLATFORM_NAME } from '../settings';
import { InjectConfig, InjectConfigFilePath } from './plugin-config.providers';
import { ConfigType, PluginConfig } from './plugin-config.types';
import {
  DeviceConfig,
  DiyEffectConfig,
  LightEffectConfig,
  RGBICLightDeviceConfig,
  RGBLightDeviceConfig,
} from './v2/devices';
import { GoveePluginConfig } from './v2/plugin-config.govee';
import { ShowSegmentsDeviceChangedEvent } from '../events/device-config/show-segments-device-changed.event';

@Injectable()
export class PluginConfigService implements OnModuleDestroy {
  private readonly logger: Logger = new Logger(PluginConfigService.name);
  private readonly configFilePath: string;
  private readonly configDirectory: string;
  private readonly fileLock: Lock<void> = new Lock<void>();
  private readonly configLock: Lock<void> = new Lock<void>();
  private readonly subscriptions: Subscription[] = [];
  private debouncer?: NodeJS.Timeout = undefined;
  private fsWatcher?: FSWatcher = undefined;
  private interval?: NodeJS.Timeout = undefined;

  get pluginConfig(): GoveePluginConfig {
    return this.config;
  }

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectConfigFilePath configFilePath: string,
    @InjectConfig
    private readonly config: GoveePluginConfig,
  ) {
    setInterval(() => Logger.flush(), 1000);
    this.configFilePath = realpathSync(configFilePath);
    this.configDirectory = dirname(realpathSync(this.configFilePath));
    this.watchForChanges();
  }

  @OnEvent(LightEffectDiscoveredEvent.name, {
    async: true,
    nextTick: true,
  })
  async onLightEffectDiscovered(event: LightEffectDiscoveredEvent<any>) {
    if (
      event.device?.id === undefined ||
      event.effect?.code === undefined ||
      event.effect?.name === undefined
    ) {
      return;
    }
    await this.configLock.acquire();

    try {
      let deviceConfig = this.config.deviceConfigs[event.device.id];
      if (!deviceConfig) {
        deviceConfig = await this.configFromDevice(event.device);
      }
      if (deviceConfig instanceof RGBLightDeviceConfig) {
        const events: LightEffectChangedEvent[] = [];
        let effect: LightEffectConfig | undefined =
          deviceConfig.effects[event.effect.code];
        if (!effect) {
          effect = LightEffectConfig.from(event.effect, deviceConfig);
          if (effect === undefined) {
            return;
          }
          events.push(
            new AddLightEffectEvent(event.device.id, {
              code: effect.code,
              name: effect.name,
              enabled: effect!.enabled,
            }),
          );
        } else {
          events.push(
            new NameLightEffectChangedEvent(
              event.device.id,
              effect.code,
              effect.name,
            ),
            new ExposeLightEffectChangedEvent(
              event.device.id,
              effect.code,
              effect.enabled,
            ),
          );
        }
        await Promise.all(
          events.map(async (event) => await event.emit(this.eventEmitter)),
        );

        deviceConfig.effects[event.effect.code] = effect;
      }

      this.config.deviceConfigs[event.device.id] = deviceConfig;
      await new DeviceConfigUpdatedEvent(event.device.id, deviceConfig).emit(
        this.eventEmitter,
      );
    } catch (error) {
      this.logger.error(`onLightEffectDiscovered: ${error}`, error);
    } finally {
      this.configLock.release();
      this.resumeWriteInterval();
    }
  }

  @OnEvent(LightEffectRemovedEvent.name, {
    async: true,
    nextTick: true,
  })
  async onLightEffectRemoved(event: LightEffectRemovedEvent<DeviceStatesType>) {
    if (event.device?.id === undefined || event.effect?.code === undefined) {
      return;
    }
    await this.configLock.acquire();
    try {
      let deviceConfig = this.config.deviceConfigs[event.device.id];
      if (!deviceConfig) {
        deviceConfig = await this.configFromDevice(event.device);
      }
      if (deviceConfig instanceof RGBLightDeviceConfig) {
        delete deviceConfig.effects[event.effect.code];
      }
      this.config.deviceConfigs[event.device.id] = deviceConfig;
      await new RemoveLightEffectEvent(event.device.id, event.effect.code).emit(
        this.eventEmitter,
      );
      await new DeviceConfigUpdatedEvent(event.device.id, deviceConfig).emit(
        this.eventEmitter,
      );
    } catch (error) {
      this.logger.error(`onLightEffectRemoved: ${error}`, error);
    } finally {
      this.configLock.release();
      this.resumeWriteInterval();
    }
  }

  @OnEvent(DiyEffectDiscoveredEvent.name, {
    async: true,
    nextTick: true,
  })
  async onDiyEffectDiscovered(
    event: DiyEffectDiscoveredEvent<DeviceStatesType>,
  ) {
    if (
      event.device?.id === undefined ||
      event.effect?.code === undefined ||
      event.effect?.name === undefined
    ) {
      return;
    }
    await this.configLock.acquire();
    try {
      let deviceConfig = this.config.deviceConfigs[event.device.id];
      if (!deviceConfig) {
        deviceConfig = await this.configFromDevice(event.device);
      }
      if (deviceConfig instanceof RGBLightDeviceConfig) {
        const events: DiyEffectChangedEvent[] = [];
        let effect: DiyEffectConfig | undefined =
          deviceConfig.diy[event.effect.code];
        if (!effect) {
          effect = DiyEffectConfig.from(event.effect, deviceConfig);
          if (effect === undefined) {
            return;
          }
          events.push(
            new AddDiyEffectEvent(event.device.id, {
              code: effect.code,
              name: effect.name,
              enabled: effect!.enabled,
            }),
          );
        } else {
          events.push(
            new NameDiyEffectChangedEvent(
              event.device.id,
              effect.code,
              effect.name,
            ),
            new ExposeDiyEffectChangedEvent(
              event.device.id,
              effect.code,
              effect.enabled,
            ),
          );
        }
        deviceConfig.diy[event.effect.code] = effect;
        await Promise.all(
          events.map(async (event) => await event.emit(this.eventEmitter)),
        );
      }
      this.config.deviceConfigs[event.device.id] = deviceConfig;
      await new DeviceConfigUpdatedEvent(event.device.id, deviceConfig).emit(
        this.eventEmitter,
      );
    } catch (error) {
      this.logger.error(`onDiyEffectDiscovered: ${error}`, error);
    } finally {
      this.configLock.release();
      this.resumeWriteInterval();
    }
  }

  @OnEvent(DiyEffectRemovedEvent.name, {
    async: true,
    nextTick: true,
  })
  async onDiyEffectRemoved(event: DiyEffectRemovedEvent<DeviceStatesType>) {
    if (event.device?.id === undefined || event.effect?.code === undefined) {
      return;
    }
    await this.configLock.acquire();
    try {
      const deviceConfig = this.config.deviceConfigs[event.device.id];
      if (!deviceConfig) {
        return;
      }
      if (deviceConfig instanceof RGBLightDeviceConfig) {
        delete deviceConfig.diy[event.effect.code];
      }
      this.config.deviceConfigs[event.device.id] = deviceConfig;
      await new RemoveDiyEffectEvent(event.device.id, event.effect.code).emit(
        this.eventEmitter,
      );
      await new DeviceConfigUpdatedEvent(event.device.id, deviceConfig).emit(
        this.eventEmitter,
      );
    } catch (error) {
      this.logger.error(`onDiyEffectRemoved: ${error}`, error);
    } finally {
      this.configLock.release();
      this.resumeWriteInterval();
    }
  }

  onModuleDestroy() {
    Logger.flush();
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
    if (this.interval !== undefined) {
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

  private async reloadConfig() {
    this.stopWatching();
    await this.fileLock.acquire();
    this.logger.log('Reloading configuration from disk...');
    try {
      await this.loadConfigFromFile();
    } finally {
      this.fileLock.release();
      this.watchForChanges();
    }
  }

  private async writeConfig() {
    this.pauseWriteInterval();
    this.stopWatching();
    await this.fileLock.acquire();
    this.logger.log('Writing updated configuration to disk...');
    await this.loadConfigFromFile();
    try {
      const data = await readFile(this.configFilePath, { encoding: 'utf8' });
      const config = JSON.parse(data);
      if (!config.platforms) {
        return;
      }

      const index = config.platforms.findIndex(
        (platformConfig) => platformConfig.platform === PLATFORM_NAME,
      );

      const pluginConfig = instanceToPlain(this.config) as PluginConfig;

      if (index < 0) {
        config.platforms.push(pluginConfig);
      } else {
        config.platforms[index] = pluginConfig;
      }

      await writeFile(this.configFilePath, JSON.stringify(config, null, 2));
    } finally {
      this.fileLock.release();
      this.watchForChanges();
    }
  }

  private async loadConfigFromFile() {
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
    await this.configLock.acquire();
    try {
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
      if (!this.config.deviceConfigs) {
        this.config.deviceConfigs = {};
      }

      Object.entries(this.config.deviceConfigs).forEach(async ([id, cfg]) => {
        const events: BaseEvent[] = [];
        const deviceConfig = goveeConfig.deviceConfigs[id];
        if (!deviceConfig) {
          return;
        }
        cfg.debug = deviceConfig.debug;
        cfg.name = deviceConfig.name;
        cfg.exposePrevious = deviceConfig.exposePrevious;
        cfg.ignore = deviceConfig.ignore;
        events.push(
          new DebugDeviceChangedEvent(cfg.id, cfg.debug),
          new ExposePreviousDeviceChanged(cfg.id, cfg.exposePrevious),
          new IgnoreDeviceChangedEvent(cfg.id, cfg.ignore),
        );
        if (cfg.name !== undefined) {
          events.push(new NameDeviceChangedEvent(cfg.id, cfg.name!));
        }
        if (
          cfg instanceof RGBICLightDeviceConfig &&
          deviceConfig instanceof RGBICLightDeviceConfig
        ) {
          cfg.showSegments = deviceConfig.showSegments;
          events.push(
            new ShowSegmentsDeviceChangedEvent(cfg.id, cfg.showSegments),
          );
        }
        if (
          cfg instanceof RGBLightDeviceConfig &&
          deviceConfig instanceof RGBLightDeviceConfig
        ) {
          Object.values(cfg.effects)
            .map((effectConfig) => {
              if (effectConfig?.code === undefined) {
                return effectConfig;
              }
              const effectCfg = deviceConfig.effects[effectConfig.code];
              if (!effectCfg) {
                return effectConfig;
              }
              effectCfg.code = effectConfig.code;
              effectCfg.name = effectConfig.name;
              effectCfg.enabled = effectConfig.enabled === true;
              effectCfg.code = effectConfig.code;
              return effectCfg;
            })
            .forEach((effectConfig) => {
              if (effectConfig?.code === undefined) {
                return;
              }
              cfg.effects[effectConfig.code] = effectConfig;
              events.push(
                new ExposeLightEffectChangedEvent(
                  cfg.id,
                  effectConfig.code,
                  effectConfig.enabled,
                ),
                new NameLightEffectChangedEvent(
                  cfg.id,
                  effectConfig.code,
                  effectConfig.name,
                ),
              );
            });
          Object.values(cfg.diy)
            .map((effectConfig) => {
              if (effectConfig?.code === undefined) {
                return effectConfig;
              }
              const effectCfg = deviceConfig.diy[effectConfig.code];
              if (!effectCfg) {
                return effectConfig;
              }
              effectCfg.code = effectConfig.code;
              effectCfg.name = effectConfig.name;
              effectCfg.enabled = effectConfig.enabled === true;
              effectCfg.code = effectConfig.code;
              return effectCfg;
            })
            .forEach((effectConfig) => {
              if (effectConfig?.code === undefined) {
                return;
              }
              cfg.diy[effectConfig.code] = effectConfig;
              events.push(
                new ExposeDiyEffectChangedEvent(
                  cfg.id,
                  effectConfig.code,
                  effectConfig.enabled,
                ),
                new NameDiyEffectChangedEvent(
                  cfg.id,
                  effectConfig.code,
                  effectConfig.name,
                ),
              );
            });

          await Promise.all(
            events.map((event) => event.emit(this.eventEmitter)),
          );
        }
        this.config.deviceConfigs[id] = cfg;
      });
    } finally {
      this.configLock.release();
    }
  }

  private async configFromDevice<
    States extends DeviceStatesType,
    T extends Device<States>,
  >(device: T): Promise<ConfigType<States>> {
    const config: ConfigType<States> =
      device instanceof RGBICLightDevice
        ? new RGBICLightDeviceConfig()
        : device instanceof RGBLightDevice
          ? new RGBLightDeviceConfig()
          : new DeviceConfig();
    config.id = device.id;
    config.name = device.name;
    config.type =
      device instanceof RGBICLightDevice
        ? 'rgbic'
        : device instanceof RGBLightDevice
          ? 'rgb'
          : 'device';

    if (device instanceof RGBICLightDevice) {
      const lightDevice: RGBICLightDevice = device;
      const lightEffectState = lightDevice.lightEffect;
      const diyEffectState = lightDevice.diyEffect;
      const lightEffects = Array.from(
        lightEffectState?.effects.values() ?? [],
      ).filter(
        (effect) => effect?.code !== undefined && effect?.name !== undefined,
      );
      const diyEffects = Array.from(
        diyEffectState?.effects.values() ?? [],
      ).filter(
        (effect) => effect?.code !== undefined && effect?.name !== undefined,
      );
      const lightConfig = config as RGBICLightDeviceConfig;
      lightConfig.effects = Object.fromEntries(
        lightEffects.map((effect) => [
          effect.code!,
          LightEffectConfig.from(effect)!,
        ]),
      );
      lightConfig.diy = Object.fromEntries(
        diyEffects.map((effect) => [
          effect.code!,
          DiyEffectConfig.from(effect)!,
        ]),
      );
      await Promise.all([
        ...lightEffects.map(
          async (effect) =>
            await new LightEffectDiscoveredEvent(device, effect).emit(
              this.eventEmitter,
            ),
        ),
        ...diyEffects.map(
          async (effect) =>
            await new DiyEffectDiscoveredEvent(device, effect).emit(
              this.eventEmitter,
            ),
        ),
      ]);
      return lightConfig;
    }

    return config;
  }

  async getDeviceConfiguration<
    States extends DeviceStatesType,
    T extends Device<States>,
  >(device: T): Promise<ConfigType<States>> {
    using(device.state<LightEffectState>(LightEffectStateName)).do(
      (lightEffectState) => {
        if (lightEffectState == undefined) {
          return;
        }
        lightEffectState.effects.delta$.subscribe(async (delta) => {
          await Promise.all([
            ...Array.from(delta.added.values()).map(
              async (effect) =>
                await new LightEffectDiscoveredEvent(device, effect).emit(
                  this.eventEmitter,
                ),
            ),
            ...Array.from(delta.deleted.values()).map(
              async (effect) =>
                await new LightEffectRemovedEvent(device, effect).emit(
                  this.eventEmitter,
                ),
            ),
          ]);
        });
      },
    );
    using(device.state<DiyModeState>(DiyModeStateName)).do((diyEffectState) => {
      if (diyEffectState == undefined) {
        return;
      }
      diyEffectState.effects.delta$.subscribe(async (delta) => {
        await Promise.all([
          ...Array.from(delta.added.values()).map(
            async (effect) =>
              await new DiyEffectDiscoveredEvent(device, effect).emit(
                this.eventEmitter,
              ),
          ),
          ...Array.from(delta.deleted.values()).map(
            async (effect) =>
              await new DiyEffectRemovedEvent(device, effect).emit(
                this.eventEmitter,
              ),
          ),
        ]);
      });
    });
    let config: ConfigType<States> = this.config.deviceConfigs[device.id];
    if (!config) {
      config = await this.configFromDevice<States, T>(device);
      this.config.deviceConfigs[device.id] = config;
    }

    this.resumeWriteInterval();

    return config;
  }
}

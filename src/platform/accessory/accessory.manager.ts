import {
  AirQualityDevice,
  Device,
  DeviceStatesType,
  HumidifierDevice,
  HygrometerDevice,
  PurifierDevice,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Lock } from 'async-await-mutex-lock';
import { BinaryLike } from 'crypto';
import { API, Categories } from 'homebridge';
import { Subscription, interval } from 'rxjs';
import { ConfigType } from '../../config';
import { PluginConfigService } from '../../config/plugin-config.service';
import {
  AddDiyEffectEvent,
  AddLightEffectEvent,
  DebugDeviceChangedEvent,
  DeviceConfigChangedEvent,
  DiyEffectChangedEvent,
  ExposeDiyEffectChangedEvent,
  ExposeLightEffectChangedEvent,
  ExposePreviousDeviceChanged,
  IgnoreDeviceChangedEvent,
  LightEffectChangedEvent,
  NameDeviceChangedEvent,
  NameDiyEffectChangedEvent,
  NameLightEffectChangedEvent,
  RemoveDiyEffectEvent,
  RemoveLightEffectEvent,
} from '../../events';
import { ShowSegmentsDeviceChangedEvent } from '../../events/device-config/show-segments-device-changed.event';
import { LoggingService } from '../../logger/logger.service';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { InjectHomebridgeApi, InjectUUID } from './accessory.const';
import { GoveeAccessory, GoveePlatformAccessory } from './govee.accessory';
import { HandlerRegistry } from './handlers';

const categoryMap = {
  [HumidifierDevice.deviceType]: Categories.AIR_HUMIDIFIER,
  [PurifierDevice.deviceType]: Categories.AIR_PURIFIER,
  [AirQualityDevice.deviceType]: Categories.SENSOR,
  [HygrometerDevice.deviceType]: Categories.SENSOR,
  [RGBICLightDevice.deviceType]: Categories.LIGHTBULB,
  [RGBLightDevice.deviceType]: Categories.LIGHTBULB,
};

@Injectable()
export class AccessoryManager {
  private lock: Lock<void> = new Lock();
  private updateQueue: Set<string> = new Set();
  private readonly accessories: Map<string, GoveePlatformAccessory> = new Map();
  private readonly goveeAccessories: Map<string, GoveeAccessory<any>> =
    new Map();
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly handlerRegistry: HandlerRegistry,
    private readonly logger: LoggingService,
    private readonly configService: PluginConfigService,
    @InjectHomebridgeApi private readonly api: API,
    @InjectUUID
    private readonly uuid: (data: BinaryLike) => string,
  ) {
    this.subscriptions.push(
      interval(5000).subscribe(async () => {
        const ids = Array.from(this.updateQueue.values());
        this.updateQueue.clear();

        const accessories = ids
          .map((id) => this.goveeAccessories.get(id))
          .filter((acc) => !!acc);
        await Promise.all(
          accessories.map(
            async (acc) => await this.updateAccessoryHandlers(acc!),
          ),
        );
        this.api.updatePlatformAccessories(
          accessories.map((acc) => acc!.accessory),
        );
      }),
    );
  }

  onAccessoryLoaded(accessory: GoveePlatformAccessory) {
    accessory.context.initialized = {};
    this.accessories.set(accessory.UUID, accessory);
    this.logger.info(`Loaded ${accessory.displayName} from cache`);
  }

  private buildGoveeAccessory<States extends DeviceStatesType>(
    device: Device<States>,
    accessory: GoveePlatformAccessory,
    deviceConfig: ConfigType<States>,
  ): GoveeAccessory<States> {
    const goveeAccessory = new GoveeAccessory(
      device,
      accessory,
      accessory.context?.deviceConfig
        ? GoveeAccessory.parseConfig(accessory.context.deviceConfig)
        : deviceConfig,
    );
    this.goveeAccessories.set(device.id, goveeAccessory);
    return goveeAccessory;
  }

  @OnEvent(AddLightEffectEvent.name, {
    async: true,
    nextTick: true,
  })
  onAddLightEffect(event: AddLightEffectEvent) {
    try {
      if (event.code === undefined || event.effectConfig.name === undefined) {
        return;
      }
      const accessory = this.goveeAccessories.get(event.deviceId);
      if (!accessory) {
        return;
      }
      if (accessory.addLightEffect(event.effectConfig)) {
        this.updateQueue.add(accessory.device.id);
      }
    } catch (error) {
      this.logger.error(`onAddLightEffect: ${error}`, error);
    }
  }

  @OnEvent(RemoveLightEffectEvent.name, {
    async: true,
    nextTick: true,
  })
  onRemoveLightEffect(event: RemoveLightEffectEvent) {
    try {
      if (event.code === undefined) {
        return;
      }
      const accessory = this.goveeAccessories.get(event.deviceId);
      if (!accessory) {
        return;
      }
      if (accessory.removeLightEffect(event.code)) {
        this.updateQueue.add(accessory.device.id);
      }
    } catch (error) {
      this.logger.error(`onRemoveLightEffect: ${error}`, error);
    }
  }

  @OnEvent(AddDiyEffectEvent.name, {
    async: true,
    nextTick: true,
  })
  onAddDiyEffect(event: AddDiyEffectEvent) {
    try {
      if (event.code === undefined || event.effectConfig.name === undefined) {
        return;
      }
      const accessory = this.goveeAccessories.get(event.deviceId);
      if (!accessory) {
        return;
      }
      if (accessory.addDiyEffect(event.effectConfig)) {
        this.updateQueue.add(accessory.device.id);
      }
    } catch (error) {
      this.logger.error(`onAddLightEffect: ${error}`, error);
    }
  }

  @OnEvent(RemoveDiyEffectEvent.name, {
    async: true,
    nextTick: true,
  })
  onRemoveDiyEffect(event: RemoveDiyEffectEvent) {
    try {
      if (event.code === undefined) {
        return;
      }
      const accessory = this.goveeAccessories.get(event.deviceId);
      if (!accessory) {
        return;
      }
      if (accessory.removeLightEffect(event.code)) {
        this.updateQueue.add(accessory.device.id);
      }
    } catch (error) {
      this.logger.error(`onRemoveLightEffect: ${error}`, error);
    }
  }

  @OnEvent(ExposeDiyEffectChangedEvent.name, {
    async: true,
    nextTick: true,
  })
  onDiyEffectExposeChange(event: ExposeDiyEffectChangedEvent) {
    try {
      this.onDiyEffectChange(event);
    } catch (error) {
      this.logger.error(`onDiyEffectExpsoeChanged: ${error}`, error);
    }
  }

  @OnEvent(NameDiyEffectChangedEvent.name, {
    async: true,
    nextTick: true,
  })
  onDiyEffectNameChange(event: NameDiyEffectChangedEvent) {
    try {
      this.onDiyEffectChange(event);
    } catch (error) {
      this.logger.error(`onDiyEffectNameChanged: ${error}`, error);
    }
  }

  @OnEvent(ExposePreviousDeviceChanged.name, {
    async: true,
    nextTick: true,
  })
  onExposePreviousDeviceChange(event: ExposePreviousDeviceChanged) {
    try {
      this.onDeviceConfigEffectChange(event);
    } catch (error) {
      this.logger.error(`onPreviousDeviceChange: ${error}`, error);
    }
  }

  @OnEvent(IgnoreDeviceChangedEvent.name, {
    async: true,
    nextTick: true,
  })
  onIgnoreDeviceChange(event: IgnoreDeviceChangedEvent) {
    try {
      this.onDeviceConfigEffectChange(event);
    } catch (error) {
      this.logger.error(`onIgnoreDeviceChange: ${error}`, error);
    }
  }

  @OnEvent(NameDeviceChangedEvent.name, {
    async: true,
    nextTick: true,
  })
  onNameDeviceChange(event: NameDeviceChangedEvent) {
    try {
      this.onDeviceConfigEffectChange(event);
    } catch (error) {
      this.logger.error(`onNameDeviceChange: ${error}`, error);
    }
  }

  @OnEvent(ShowSegmentsDeviceChangedEvent.name, {
    async: true,
    nextTick: true,
  })
  onShowSegmentsDeviceChange(event: ShowSegmentsDeviceChangedEvent) {
    try {
      this.onDeviceConfigEffectChange(event);
    } catch (error) {
      this.logger.error(`onShowSegmentsDeviceChange: ${error}`, error);
    }
  }

  @OnEvent(DebugDeviceChangedEvent.name, {
    async: true,
    nextTick: true,
  })
  onDebugDeviceChange(event: DebugDeviceChangedEvent) {
    try {
      this.onDeviceConfigEffectChange(event);
    } catch (error) {
      this.logger.error(`onDebugDeviceChange: ${error}`, error);
    }
  }

  private async updateAccessoryHandlers(goveeAccessory: GoveeAccessory<any>) {
    await this.handlerRegistry.updateAccessoryHandlers(goveeAccessory);
  }

  onDeviceConfigEffectChange(event: DeviceConfigChangedEvent) {
    const accessory = this.goveeAccessories.get(event.deviceId);
    if (!accessory) {
      return;
    }
    let changed: boolean = false;
    let newValue: string | boolean;
    switch (true) {
      case event instanceof ExposePreviousDeviceChanged:
        newValue = (event as ExposePreviousDeviceChanged).exposePrevious;
        if (newValue !== accessory.exposePreviousButton) {
          accessory.exposePreviousButton = newValue;
          changed = true;
        }
        break;
      case event instanceof IgnoreDeviceChangedEvent:
        newValue = (event as IgnoreDeviceChangedEvent).ignoreDevice;
        if (newValue !== accessory.isIgnored) {
          accessory.isIgnored = newValue;
          changed = true;
        }
        break;
      case event instanceof NameDeviceChangedEvent:
        newValue = (event as NameDeviceChangedEvent).name;
        if (newValue !== accessory.name) {
          accessory.name = newValue;
          changed = true;
        }
        break;
      case event instanceof ShowSegmentsDeviceChangedEvent:
        newValue = (event as ShowSegmentsDeviceChangedEvent).showSegments;
        if (newValue !== accessory.shouldShowSegments) {
          accessory.shouldShowSegments = newValue;
          changed = true;
        }
        break;
    }
    if (changed) {
      this.updateQueue.add(accessory.device.id);
    }
  }

  onDiyEffectChange(event: DiyEffectChangedEvent) {
    const accessory = this.goveeAccessories.get(event.deviceId);
    if (!accessory) {
      return;
    }
    const effect = accessory.diyEffects.get(event.code);
    if (!effect) {
      return;
    }
    let changed: boolean = false;
    let newValue: boolean | string;
    switch (true) {
      case event instanceof ExposeDiyEffectChangedEvent:
        newValue = (event as ExposeDiyEffectChangedEvent).expose;
        if (newValue !== effect.isExposed) {
          effect.isExposed = newValue;
          changed = true;
        }
        break;
      case event instanceof NameDiyEffectChangedEvent:
        newValue = (event as NameDiyEffectChangedEvent).name;
        if (newValue !== effect.name) {
          effect.name = newValue;
          changed = true;
        }
        break;
    }
    if (changed) {
      this.updateQueue.add(accessory.device.id);
    }
  }

  onLightEffectChange(event: LightEffectChangedEvent) {
    const accessory = this.goveeAccessories.get(event.deviceId);
    if (!accessory) {
      return;
    }
    const effect = accessory.lightEffects.get(event.code);
    if (!effect) {
      return;
    }
    let changed: boolean = false;
    let newValue: boolean | string;
    switch (true) {
      case event instanceof ExposeLightEffectChangedEvent:
        newValue = (event as ExposeLightEffectChangedEvent).expose;
        if (newValue !== effect.isExposed) {
          effect.isExposed = newValue;
          changed = true;
        }
        break;
      case event instanceof NameLightEffectChangedEvent:
        newValue = (event as NameLightEffectChangedEvent).name;
        if (newValue !== effect.name) {
          effect.name = newValue;
          changed = true;
        }
        break;
    }
    if (changed) {
      this.updateQueue.add(accessory.device.id);
    }
  }

  async onDeviceDiscovered(device: Device) {
    this.logger.info(`Discovered Device ${device.id}`);
    const uuid = this.uuid(device.id);
    const accessory: GoveePlatformAccessory =
      this.accessories.get(uuid) ??
      new this.api.platformAccessory(
        device.name,
        uuid,
        categoryMap[device.deviceType],
      );
    if (!this.accessories.has(uuid)) {
      this.logger.info(`Registering new accessory for ${device.id}`);
      this.accessories.set(device.id, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    }
    const goveeAccessory = this.buildGoveeAccessory(
      device,
      accessory,
      await this.configService.getDeviceConfiguration(device),
    );
    if (device instanceof RGBICLightDevice) {
      let interval: NodeJS.Timeout | undefined = undefined;
      const rgbicLightDevice = device as RGBICLightDevice;
      let effectCount: number =
        rgbicLightDevice.lightEffect?.effects?.size ?? 0;
      let iterations: number = 0;
      await new Promise<void>((resolve) => {
        interval = setInterval(() => {
          const newCount = rgbicLightDevice.lightEffect?.effects?.size ?? 0;
          if (newCount !== effectCount) {
            iterations = 0;
            effectCount = newCount;
          } else if (iterations > 5) {
            iterations++;
            clearInterval(interval);
            resolve();
          } else {
            iterations++;
          }
        }, 1000);
      });
    }

    this.updateQueue.add(goveeAccessory.device.id);
  }
}

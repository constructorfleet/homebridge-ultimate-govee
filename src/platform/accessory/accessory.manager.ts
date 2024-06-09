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
import { API, Categories, PlatformAccessory } from 'homebridge';
import { Subject, Subscription, bufferTime, distinct } from 'rxjs';
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
import { GoveeAccessory } from './govee.accessory';
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
  private updateQueue$: Subject<GoveeAccessory<any>> = new Subject();
  private readonly accessories: Map<string, PlatformAccessory> = new Map();
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
      this.updateQueue$
        .pipe(
          distinct((acc) => acc.id),
          bufferTime(5000),
        )
        .subscribe(async (accessories) => {
          await Promise.all(
            accessories.map(
              async (acc) => await this.updateAccessoryHandlers(acc),
            ),
          );
          this.api.updatePlatformAccessories(
            accessories.map((acc) => acc.accessory),
          );
        }),
    );
  }

  onAccessoryLoaded(accessory: PlatformAccessory) {
    accessory.context.initialized = {};
    this.accessories.set(accessory.UUID, accessory);
    this.logger.info(`Loaded ${accessory.displayName} from cache`);
  }

  private buildGoveeAccessory<States extends DeviceStatesType>(
    device: Device<States>,
    accessory: PlatformAccessory,
    deviceConfig: ConfigType<States>,
  ): GoveeAccessory<States> {
    const goveeAccessory = new GoveeAccessory(device, accessory, deviceConfig);
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
      accessory.addLightEffect(event.effectConfig);
      this.updateQueue$.next(accessory);
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
      accessory.removeLightEffect(event.code);
      this.updateQueue$.next(accessory);
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
      accessory.addDiyEffect(event.effectConfig);
      this.updateQueue$.next(accessory);
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
      accessory.removeLightEffect(event.code);
      this.updateQueue$.next(accessory);
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
    this.updateQueue$.next(goveeAccessory);
  }

  onDeviceConfigEffectChange(event: DeviceConfigChangedEvent) {
    const accessory = this.goveeAccessories.get(event.deviceId);
    if (!accessory) {
      return;
    }
    switch (true) {
      case event instanceof ExposePreviousDeviceChanged:
        accessory.exposePreviousButton = (
          event as ExposePreviousDeviceChanged
        ).exposePrevious;
        break;
      case event instanceof IgnoreDeviceChangedEvent:
        accessory.isIgnored = (event as IgnoreDeviceChangedEvent).ignoreDevice;
        break;
      case event instanceof NameDeviceChangedEvent:
        accessory.name = (event as NameDeviceChangedEvent).name;
        break;
      case event instanceof ShowSegmentsDeviceChangedEvent:
        accessory.shouldShowSegments = (
          event as ShowSegmentsDeviceChangedEvent
        ).showSegments;
        break;
    }
    this.updateQueue$.next(accessory);
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
    switch (true) {
      case event instanceof ExposeDiyEffectChangedEvent:
        effect.isExposed = (event as ExposeDiyEffectChangedEvent).expose;
        break;
      case event instanceof NameDiyEffectChangedEvent:
        effect.name = (event as NameDiyEffectChangedEvent).name;
        break;
    }
    this.updateQueue$.next(accessory);
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
    switch (true) {
      case event instanceof ExposeLightEffectChangedEvent:
        effect.isExposed = (event as ExposeLightEffectChangedEvent).expose;
        break;
      case event instanceof NameLightEffectChangedEvent:
        effect.name = (event as NameLightEffectChangedEvent).name;
        break;
    }
    this.updateQueue$.next(accessory);
  }

  async onDeviceDiscovered(device: Device) {
    this.logger.info(`Discovered Device ${device.id}`);
    const deviceConfig =
      await this.configService.getDeviceConfiguration(device);
    const uuid = this.uuid(device.id);
    const accessory: PlatformAccessory =
      this.accessories.get(uuid) ??
      new this.api.platformAccessory(
        deviceConfig.name ?? device.name,
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

    if (device instanceof RGBICLightDevice) {
      let interval: NodeJS.Timeout | undefined = undefined;
      let iterations: number = 0;
      await new Promise<void>((resolve) => {
        interval = setInterval(() => {
          if (
            ((device as RGBICLightDevice).lightEffect?.effects?.size ?? 0) >=
              0 ||
            iterations++ > 5
          ) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    }

    const goveeAccessory = this.buildGoveeAccessory(
      device,
      accessory,
      deviceConfig,
    );

    accessory.context.device = this.getSafeDeviceModel(device);

    this.updateQueue$.next(goveeAccessory);
  }

  private getSafeDeviceModel(device: Device) {
    const deviceModel = device.device;

    if (!deviceModel) {
      return undefined;
    }
    return {
      ...deviceModel,
      status: deviceModel.status.getValue(),
    };
  }
}

import { Injectable } from '@nestjs/common';
import {
  API,
  Categories,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';
import { InjectHomebridgeApi } from '../../core';
import {
  AirQualityDevice,
  Device,
  HumidifierDevice,
  HygrometerDevice,
  PurifierDevice,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { InjectUUID } from '../../core/core.const';
import { BinaryLike } from 'crypto';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { InjectConfig } from '../../config/plugin-config.providers';
import { PluginConfigService } from '../../config/plugin-config.service';
import { ServiceRegistry } from './services/services.registry';
import { PartialBehaviorSubject } from '../../common';
import { GoveePluginConfig } from '../../config/v2/plugin-config.govee';
import { LoggingService } from '../../logger/logger.service';
import { Lock } from 'async-await-mutex-lock';
import { HandlerRegistry } from './handlers';
import { sampleTime } from 'rxjs';

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
  private readonly accessories: Map<string, PlatformAccessory> = new Map<
    string,
    PlatformAccessory
  >();

  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly handlerRegistry: HandlerRegistry,
    @InjectConfig
    private readonly config: PartialBehaviorSubject<GoveePluginConfig>,
    private readonly logger: LoggingService,
    private readonly configService: PluginConfigService,
    @InjectHomebridgeApi private readonly api: API,
    @InjectUUID
    private readonly uuid: (data: BinaryLike) => string,
  ) {
    this.serviceRegistry.logger = logger;
  }

  onAccessoryLoaded(accessory: PlatformAccessory) {
    //}, device: Device) {
    const device = accessory.context.device;
    accessory.context.initialized = {};
    if (!device || !device.id) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      return;
    }
    const deviceConfig = this.configService.getDeviceConfiguration(device);

    if (deviceConfig?.ignore) {
      this.logger.debug(`Ignoring ${accessory.displayName}`);
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      return;
    }
    this.accessories.set(device.id, accessory);
    this.api.updatePlatformAccessories([accessory]);
    this.logger.debug(`Loaded ${accessory.displayName} from cache`);
  }

  onDeviceUpdated(device: Device) {
    if (!this.accessories.has(device.id)) {
      return;
    }

    const accessory = this.accessories.get(device.id);
    if (!accessory) {
      return;
    }

    accessory.context.device = this.getSafeDeviceModel(device);
    accessory.services
      .filter((service) => 'update' in service)
      .forEach(
        (service) =>
          'update' in service &&
          typeof service.update === 'function' &&
          service.update(device),
      );

    this.api.updatePlatformAccessories([accessory]);
  }

  async onDeviceDiscovered(device: Device) {
    await this.lock.acquire();
    this.logger.debug(`Discovered Device ${device.id}`);
    try {
      const accessory: PlatformAccessory =
        this.accessories.get(device.id) ??
        new this.api.platformAccessory(
          device.name,
          this.uuid(device.id),
          categoryMap[device.deviceType],
        );
      if (!this.accessories.has(device.id)) {
        this.logger.debug(`Registering new accessory for ${device.id}`);
        this.accessories.set(device.id, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
      accessory.context.device = this.getSafeDeviceModel(device);
      this.handlerRegistry
        .for(device)
        ?.forEach((handler) => handler.setup(accessory, device));

      device.pipe(sampleTime(20000)).subscribe(() => {
        this.api.updatePlatformAccessories([accessory]);
      });
    } finally {
      this.lock.release();
    }
    // await this.platformConfigService.updateConfigurationWithDevices(device);
  }

  private get(
    accessory: PlatformAccessory,
    service: WithUUID<Service>,
  ): Service {
    return accessory.getService(service.UUID) ?? accessory.addService(service);
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

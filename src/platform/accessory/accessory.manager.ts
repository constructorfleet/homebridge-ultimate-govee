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
import { GoveeService } from './services/govee-service';
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

  async onAccessoryLoaded(accessory: PlatformAccessory, device: Device) {
    if (!device || !device.id) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      return;
    }
    const deviceConfig = this.configService.getDeviceConfiguration(device.id);

    if (deviceConfig?.ignore) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      return;
    }
    await this.onDeviceDiscovered(device);
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
    // accessory.services.filter((service) => 'update' in service).forEach((service) => 'update' in service && typeof service.update === 'function' && service.update(device));

    this.api.updatePlatformAccessories([accessory]);
  }

  async onDeviceDiscovered(device: Device) {
    await this.lock.acquire();
    try {
      const accessory: PlatformAccessory =
        this.accessories.get(device.id) ??
        new this.api.platformAccessory(
          device.name,
          this.uuid(device.id),
          categoryMap[device.deviceType],
        );

      accessory.context.device = this.getSafeDeviceModel(device);
      // accessory.context.config = deviceConfig;
      // device.name = deviceConfig?.displayName || device.name;
      this.serviceRegistry.getServices(device, accessory);
      if (this.accessories.has(device.id)) {
        this.accessories
          .get(device.id)
          ?.services?.forEach((service) =>
            (service as GoveeService).update(device),
          );
        return;
      }
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      // device.subscribe((device) => {
      //   this.onDeviceUpdated(device);
      // });
      this.accessories.set(device.id, accessory);
      this.api.updatePlatformAccessories([accessory]);
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

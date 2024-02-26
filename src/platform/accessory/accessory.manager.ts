import { Injectable } from '@nestjs/common';
import { API, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { InjectHomebridgeApi } from '../../core';
import { Device } from '@constructorfleet/ultimate-govee';
import { InjectUUID } from '../../core/core.const';
import { BinaryLike } from 'crypto';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { InjectConfig } from '../../config/plugin-config.providers';
import { PluginConfigService } from '../../config/plugin-config.service';
import { ServiceRegistry } from './services/services.registry';
import { PartialBehaviorSubject } from '../../common';
import { GoveePluginConfig } from '../../config/v2/plugin-config.govee';

@Injectable()
export class AccessoryManager {
  private readonly accessories: Map<string, PlatformAccessory> = new Map<
    string,
    PlatformAccessory
  >();

  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    @InjectConfig
    private readonly config: PartialBehaviorSubject<GoveePluginConfig>,
    private readonly configService: PluginConfigService,
    @InjectHomebridgeApi private readonly api: API,
    @InjectUUID
    private readonly uuid: (data: BinaryLike) => string,
  ) {}

  async onAccessoryLoaded(accessory: PlatformAccessory) {
    const device = accessory.context.device;
    if (!device || !device.deviceId) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      return;
    }
    const deviceConfig = this.configService.getDeviceConfiguration(
      device.deviceId,
    );

    if (deviceConfig?.ignore) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
      return;
    }

    this.accessories.set(accessory.UUID, accessory);
    (await this.serviceRegistry.getServices(device, accessory))?.forEach(
      (service) => this.updateAccessory(accessory, service),
    );
    this.api.updatePlatformAccessories([accessory]);
  }

  onDeviceUpdated(device: Device) {
    const deviceUUID = this.api.hap.uuid.generate(device.id);
    if (!this.accessories.has(deviceUUID)) {
      return;
    }

    const accessory = this.accessories.get(deviceUUID);
    if (!accessory) {
      return;
    }

    accessory.context.device = device;

    this.serviceRegistry
      .getServices(device, accessory)
      ?.forEach((service) => this.updateAccessory(accessory, service));

    this.api.updatePlatformAccessories([accessory]);
  }

  onDeviceDiscovered(device: Device) {
    const uuid = this.uuid(device.id);
    const accessory =
      this.accessories.get(uuid) ||
      new this.api.platformAccessory(device.name, uuid);
    // accessory.context.config = deviceConfig;
    // device.name = deviceConfig?.displayName || device.name;
    if (!this.accessories.has(uuid)) {
      this.accessories.set(uuid, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    }
    this.onDeviceUpdated(device);
    device.subscribe((device) => {
      console.dir(device);
      this.onDeviceUpdated(device);
    });
    // await this.platformConfigService.updateConfigurationWithDevices(device);
  }

  public updateAccessory(
    accessory: PlatformAccessory,
    service: Service,
  ): PlatformAccessory {
    if (!accessory.getServiceById(service.UUID, service.subtype ?? '')) {
      accessory.addService(service);
    }
    return accessory;
  }

  private get(
    accessory: PlatformAccessory,
    service: WithUUID<Service>,
  ): Service {
    return accessory.getService(service.UUID) ?? accessory.addService(service);
  }
}

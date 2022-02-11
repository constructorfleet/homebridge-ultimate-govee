import {Inject, Injectable} from '@nestjs/common';
import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {API, PlatformAccessory} from 'homebridge';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {HOMEBRIDGE_API} from '../../util/const';
import {InformationService} from './services/InformationService';
import {HumidifierService} from './services/HumidifierService';
import {PurifierService} from './services/PurifierService';
import {PLATFORM_NAME, PLUGIN_NAME} from '../../settings';
import {LoggingService} from '../../logging/LoggingService';
import {PlatformConfigService} from '../config/PlatformConfigService';
import {AccessoryService} from './services/AccessoryService';
import {DeviceSettingsReceived} from '../../core/events/devices/DeviceReceived';

@Injectable()
export class AccessoryManager extends Emitter {
  private readonly accessories: Map<string, PlatformAccessory> = new Map<string, PlatformAccessory>();

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(AccessoryService) private readonly services: AccessoryService[],
    private readonly platformConfigService: PlatformConfigService,
    private readonly log: LoggingService,
    @Inject(HOMEBRIDGE_API) private readonly api: API,
  ) {
    super(eventEmitter);
  }

  async onAccessoryLoaded(
    accessory: PlatformAccessory,
  ) {
    const device = accessory.context.device;
    const deviceConfig =
      this.platformConfigService.getDeviceConfiguration(device.deviceId);

    if (deviceConfig?.ignore) {
      this.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [accessory],
      );
      return;
    }
    this.accessories.set(
      accessory.UUID,
      accessory,
    );
    this.services.forEach((service) => service.updateAccessory(accessory, device));
    this.api.updatePlatformAccessories([accessory]);
    await this.emitAsync(
      new DeviceSettingsReceived({
        deviceId: device.deviceId,
        name: accessory.displayName,
        model: device.model,
        pactCode: device.pactCode,
        pactType: device.pactType,
        hardwareVersion: device.hardwareVersion,
        softwareVersion: device.softwareVersion,
        bleAddress: device.bleAddress,
        deviceTopic: device.iotTopic,
        macAddress: device.macAddress,
      }),
    );
  }

  @OnEvent(
    'DEVICE.Discovered',
  )
  async onDeviceDiscovered(device: GoveeDevice) {
    const deviceConfig =
      this.platformConfigService.getDeviceConfiguration(device.deviceId);
    if (deviceConfig?.ignore) {
      return;
    }
    const deviceUUID = this.api.hap.uuid.generate(device.deviceId);
    const accessory =
      this.accessories.get(deviceUUID)
      || new this.api.platformAccessory(
        device.name,
        deviceUUID,
      );

    this.services.forEach((service) => service.updateAccessory(accessory, device));
    this.api.updatePlatformAccessories([accessory]);

    if (!this.accessories.has(deviceUUID)) {
      this.accessories.set(
        deviceUUID,
        accessory,
      );
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    this.platformConfigService.updateConfigurationWithDevices(device);
  }

  @OnEvent(
    'DEVICE.Updated',
  )
  async onDeviceUpdated(device: GoveeDevice) {
    const deviceUUID = this.api.hap.uuid.generate(device.deviceId);
    if (!this.accessories.has(deviceUUID)) {
      return;
    }
    const accessory = this.accessories.get(deviceUUID);
    if (!accessory) {
      return;
    }

    this.services.forEach((service) => service.updateAccessory(accessory, device));

    this.api.updatePlatformAccessories([accessory]);
  }
}
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

@Injectable()
export class AccessoryManager extends Emitter {
  private readonly accessories: Map<string, PlatformAccessory> = new Map<string, PlatformAccessory>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly informationService: InformationService,
    private readonly humidifierService: HumidifierService,
    private readonly purifierService: PurifierService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly log: LoggingService,
    @Inject(HOMEBRIDGE_API) private readonly api: API,
  ) {
    super(eventEmitter);
  }

  onAccessoryLoaded(
    accessory: PlatformAccessory,
  ) {
    const device = accessory.context.device;
    const deviceConfig =
      this.platformConfigService
        .pluginConfiguration
        .devices?.getDeviceConfiguration(device.context.deviceId);

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
    this.informationService.initializeAccessory(accessory, device);
    this.humidifierService.initializeAccessory(accessory, device);
    this.purifierService.initializeAccessory(accessory, device);
    this.api.updatePlatformAccessories([accessory]);
  }

  @OnEvent(
    'DEVICE.Discovered',
  )
  async onDeviceDiscovered(device: GoveeDevice) {
    const deviceConfig =
      this.platformConfigService
        .pluginConfiguration
        .devices?.getDeviceConfiguration(device.deviceId);
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

    if (!this.accessories.has(deviceUUID)) {
      this.informationService.initializeAccessory(accessory, device);
      this.humidifierService.initializeAccessory(accessory, device);
      this.purifierService.initializeAccessory(accessory, device);
      this.accessories.set(
        deviceUUID,
        accessory,
      );
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    } else {
      this.informationService.updateAccessory(accessory, device);
      this.humidifierService.updateAccessory(accessory, device);
      this.purifierService.updateAccessory(accessory, device);
      this.api.updatePlatformAccessories([accessory]);
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

    this.informationService.updateAccessory(accessory, device);
    this.humidifierService.updateAccessory(accessory, device);
    this.purifierService.updateAccessory(accessory, device);

    this.api.updatePlatformAccessories([accessory]);
  }
}
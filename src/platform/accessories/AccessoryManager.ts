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
import {ColorTemperature} from './services/lightCharacteristics/ColorTemperature';
import {Hue} from './services/lightCharacteristics/Hue';
import {Saturation} from './services/lightCharacteristics/Saturation';
import {LightService} from './services/LightService';

@Injectable()
export class AccessoryManager extends Emitter {
  private readonly accessories: Map<string, PlatformAccessory> = new Map<string, PlatformAccessory>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly informationService: InformationService,
    private readonly humidifierService: HumidifierService,
    private readonly purifierService: PurifierService,
    private readonly lightService: LightService,
    private readonly colorTemperature: ColorTemperature,
    private readonly hue: Hue,
    private readonly saturation: Saturation,
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
    this.informationService.updateAccessory(accessory, device);
    this.humidifierService.updateAccessory(accessory, device);
    this.purifierService.updateAccessory(accessory, device);
    this.lightService.updateAccessory(accessory, device);
    this.hue.updateAccessory(accessory, device);
    this.saturation.updateAccessory(accessory, device);
    this.colorTemperature.updateAccessory(accessory, device);
    this.api.updatePlatformAccessories([accessory]);
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

    this.informationService.updateAccessory(accessory, device);
    this.humidifierService.updateAccessory(accessory, device);
    this.purifierService.updateAccessory(accessory, device);
    this.lightService.updateAccessory(accessory, device);
    this.hue.updateAccessory(accessory, device);
    this.saturation.updateAccessory(accessory, device);
    this.colorTemperature.updateAccessory(accessory, device);
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

    this.informationService.updateAccessory(accessory, device);
    this.humidifierService.updateAccessory(accessory, device);
    this.purifierService.updateAccessory(accessory, device);
    this.lightService.updateAccessory(accessory, device);
    this.hue.updateAccessory(accessory, device);
    this.saturation.updateAccessory(accessory, device);
    this.colorTemperature.updateAccessory(accessory, device);

    this.api.updatePlatformAccessories([accessory]);
  }
}
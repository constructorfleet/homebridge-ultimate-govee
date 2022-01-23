import {Inject, Injectable} from '@nestjs/common';
import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {API, PlatformAccessory} from 'homebridge';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';
import {HOMEBRIDGE_API, PLATFORM_LOGGER} from '../../util/const';
import {InformationService} from './services/InformationService';
import {HumidifierService} from './services/HumidifierService';
import {PurifierService} from './services/PurifierService';
import {PLATFORM_NAME, PLUGIN_NAME} from '../../settings';

@Injectable()
export class AccessoryManager extends Emitter {
  private readonly accessories: Map<string, PlatformAccessory> = new Map<string, PlatformAccessory>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly informationService: InformationService,
    private readonly humidifierService: HumidifierService,
    private readonly purifierService: PurifierService,
    @Inject(HOMEBRIDGE_API) private readonly api: API,
    @Inject(PLATFORM_LOGGER) private readonly log: Logging,
  ) {
    super(eventEmitter);
  }

  onAccessoryLoaded(
    accessory: PlatformAccessory,
  ) {
    this.accessories.set(
      accessory.UUID,
      accessory,
    );
  }

  @OnEvent(
    'DEVICE.Discovered',
    {
      async: true,
    },
  )
  onDeviceDiscovered(device: GoveeDevice) {
    const deviceUUID = this.api.hap.uuid.generate(device.deviceId);
    this.log.info('DISCOVERED', device.deviceId, deviceUUID);
    const accessory =
      this.accessories.get(deviceUUID)
      || new this.api.platformAccessory(
        device.name,
        deviceUUID,
      );

    if (!this.accessories.has(deviceUUID)) {
      this.accessories.set(
        deviceUUID,
        accessory,
      );
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    this.informationService.initializeAccessory(accessory, device);
    this.humidifierService.initializeAccessory(accessory, device);
    this.purifierService.initializeAccessory(accessory, device);
  }

  @OnEvent(
    'DEVICE.Updated',
    {
      async: true,
    },
  )
  onDeviceUpdated(device: GoveeDevice) {
    const deviceUUID = this.api.hap.uuid.generate(device.deviceId);
    this.log.info('UPDATED', device.deviceId, deviceUUID);
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
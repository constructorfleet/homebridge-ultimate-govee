import {AccessoryService} from './AccessoryService';
import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {EventEmitter2} from '@nestjs/event-emitter';
import {LoggingService} from '../../../logging/LoggingService';
import {ServiceRegistry} from '../ServiceRegistry';

@ServiceRegistry.register
export class InformationService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.AccessoryInformation;

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    log: LoggingService,
  ) {
    super(
      eventEmitter,
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service.setCharacteristic(this.CHARACTERISTICS.Manufacturer, 'Govee')
      .setCharacteristic(this.CHARACTERISTICS.Name, device.name)
      .setCharacteristic(this.CHARACTERISTICS.ConfiguredName, device.name)
      .setCharacteristic(this.CHARACTERISTICS.Model, device.model)
      .setCharacteristic(this.CHARACTERISTICS.SerialNumber, device.deviceId);
    if (device.hardwareVersion) {
      service.setCharacteristic(this.CHARACTERISTICS.FirmwareRevision, device.hardwareVersion);
    }
    if (device.softwareVersion) {
      service.setCharacteristic(this.CHARACTERISTICS.SoftwareRevision, device.softwareVersion);
    }
  }
}
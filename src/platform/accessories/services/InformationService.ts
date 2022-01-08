import {AccessoryService} from './AccessoryService';
import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';

export class InformationService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.AccessoryInformation;

  constructor(
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
  ) {
    super(SERVICES, CHARACTERISTICS);
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service.setCharacteristic(this.CHARACTERISTICS.Manufacturer, 'Govee')
      .setCharacteristic(this.CHARACTERISTICS.Model, device.model)
      .setCharacteristic(this.CHARACTERISTICS.SerialNumber, device.deviceId);
  }
}
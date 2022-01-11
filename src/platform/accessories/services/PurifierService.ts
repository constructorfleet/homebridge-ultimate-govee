import {AccessoryService} from './AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_LOGGER, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';
import {ActiveState} from '../../../devices/states/Active';
import {FanSpeedState} from '../../../devices/states/FanSpeed';

@Injectable()
export class PurifierService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.AirPurifier;

  constructor(
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    @Inject(PLATFORM_LOGGER) log: Logging,
  ) {
    super(
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }


  protected supports(device: GoveeDevice): boolean {
    return Reflect.has(device, 'fanSpeed');
  }


  protected initializeServiceCharacteristics(
    service: Service,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.TargetAirPurifierState)
      .setProps({
        minValue: 1,
        maxValue: 1,
        validValues: [1],
      })
      .updateValue(1);
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentAirPurifierState)
      .updateValue(this.CHARACTERISTICS.CurrentAirPurifierState.INACTIVE);
    service
      .getCharacteristic(this.CHARACTERISTICS.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
      });
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    const fanSpeed = (device as FanSpeedState).fanSpeed ?? 0;
    service
      .getCharacteristic(this.CHARACTERISTICS.RotationSpeed)
      .updateValue(
        fanSpeed === 16
          ? 25
          : ((fanSpeed + 1) * 25),
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentAirPurifierState)
      .updateValue(
        ((device as ActiveState).isActive ?? false)
          ? this.CHARACTERISTICS.CurrentAirPurifierState.PURIFYING_AIR
          : this.CHARACTERISTICS.CurrentAirPurifierState.IDLE,
      );
    console.log(service);
  }
}
import {AccessoryService} from './AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_LOGGER, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';
import {ActiveState} from '../../../devices/states/Active';
import {MistLevelState} from '../../../devices/states/MistLevel';
import {EventEmitter2} from '@nestjs/event-emitter';

@Injectable()
export class HumidifierService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.HumidifierDehumidifier;

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    @Inject(PLATFORM_LOGGER) log: Logging,
  ) {
    super(
      eventEmitter,
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }


  protected supports(device: GoveeDevice): boolean {
    return Reflect.has(device, 'mistLevel');
  }


  protected initializeServiceCharacteristics(service: Service) {
    service
      .getCharacteristic(this.CHARACTERISTICS.TargetHumidifierDehumidifierState)
      .setProps({
        validValues: [1],
      })
      .updateValue(1);
    service
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityDehumidifierThreshold)
      .setProps({
        validValues: [100],
      })
      .updateValue(100);
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentHumidifierDehumidifierState)
      .setProps({
        validValues: [0, 2],
      });
    service
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityHumidifierThreshold)
      .setProps({
        minValue: 0,
        maxValue: 100,
      });
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.Active)
      .updateValue((device as unknown as ActiveState).isActive ?? false);
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentHumidifierDehumidifierState)
      .updateValue((device as unknown as ActiveState).isActive ? 0 : 2);
    service
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityHumidifierThreshold)
      .updateValue(((device as MistLevelState).mistLevel ?? 0) / 8 * 100);

    console.log(service);
  }
}
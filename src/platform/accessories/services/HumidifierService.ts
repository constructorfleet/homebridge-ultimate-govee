import {AccessoryService} from './AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_LOGGER, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';
import {ActiveState} from '../../../devices/states/Active';
import {MistLevelState} from '../../../devices/states/MistLevel';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';

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
        validValues: [this.CHARACTERISTICS.TargetHumidifierDehumidifierState.HUMIDIFIER],
      })
      .updateValue(this.CHARACTERISTICS.TargetHumidifierDehumidifierState.HUMIDIFIER);
    service
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityDehumidifierThreshold)
      .setProps({
        validValues: [100],
      })
      .updateValue(100);
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentHumidifierDehumidifierState)
      .setProps({
        validValues: [
          this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.INACTIVE,
          this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.HUMIDIFYING,
        ],
      })
      .updateValue(this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.INACTIVE)
      .onSet(
        (value: CharacteristicValue, context: { device: GoveeDevice }) =>
          this.emit(
            new DeviceCommandEvent(
              'Active',
              {
                deviceId: context.device.deviceId,
                active: value === this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.HUMIDIFYING,
              },
            ),
          ),
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityHumidifierThreshold)
      .setProps({
        minValue: 0,
        maxValue: 100,
      })
      .updateValue(0)
      .onSet(
        (value: CharacteristicValue, context: { device: GoveeDevice }) =>
          this.emit(
            new DeviceCommandEvent(
              'MistLevel',
              {
                deviceId: context.device.deviceId,
                mistLevel: Math.floor((value as number || 0) / 100 * 8),
              },
            ),
          ),
      );
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.Active)
      .updateValue(
        ((device as unknown as ActiveState).isActive ?? false)
          ? this.CHARACTERISTICS.Active.ACTIVE
          : this.CHARACTERISTICS.Active.INACTIVE,
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentHumidifierDehumidifierState)
      .updateValue(
        (device as unknown as ActiveState).isActive
          ? this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.HUMIDIFYING
          : this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.INACTIVE);
    service
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityHumidifierThreshold)
      .updateValue(((device as MistLevelState).mistLevel ?? 0) / 8 * 100);
  }
}
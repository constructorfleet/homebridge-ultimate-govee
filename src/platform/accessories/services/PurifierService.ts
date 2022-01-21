import {AccessoryService} from './AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_LOGGER, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';
import {ActiveState} from '../../../devices/states/Active';
import {FanSpeedState} from '../../../devices/states/FanSpeed';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';

@Injectable()
export class PurifierService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.AirPurifier;

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
    this.setCharacteristicValueHandler(
      service
        .getCharacteristic(this.CHARACTERISTICS.CurrentAirPurifierState)
        .updateValue(this.CHARACTERISTICS.CurrentAirPurifierState.INACTIVE),
      (device: GoveeDevice, value: CharacteristicValue) =>
        this.emit(
          new DeviceCommandEvent(
            'Active',
            {
              deviceId: device.deviceId,
              active: value === this.CHARACTERISTICS.CurrentAirPurifierState.PURIFYING_AIR,
            }),
        ),
    );
    this.setCharacteristicValueHandler(
      service
        .getCharacteristic(this.CHARACTERISTICS.RotationSpeed)
        .setProps({
          minValue: 0,
          maxValue: 100,
        }),
      (device: GoveeDevice, value: CharacteristicValue) =>
        this.emit(
          new DeviceCommandEvent(
            'FanSpeed',
            {
              deviceId: device.deviceId,
              fanSpeed: Math.floor(((value as number) ?? 0) / 4) || 16,
            }),
        ),
    );
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
        ((device as unknown as ActiveState)?.isActive ?? false)
          ? this.CHARACTERISTICS.CurrentAirPurifierState.PURIFYING_AIR
          : this.CHARACTERISTICS.CurrentAirPurifierState.IDLE,
      );
    console.log(service);
  }
}
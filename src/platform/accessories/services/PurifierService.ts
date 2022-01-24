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
import {OnOffState} from '../../../devices/states/OnOff';

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
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.Active)
      .updateValue(
        (device as unknown as ActiveState)?.isActive
          ? this.CHARACTERISTICS.Active.ACTIVE
          : this.CHARACTERISTICS.Active.INACTIVE,
      )
      .onSet(async (value: CharacteristicValue) =>
        this.emit(
          new DeviceCommandEvent(
            {
              action: 'Active',
              deviceId: device.deviceId,
              active: value === this.CHARACTERISTICS.Active.ACTIVE,
            }),
        ),
      );
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
      .updateValue(
        (device as unknown as ActiveState)?.isActive
          ? this.CHARACTERISTICS.CurrentAirPurifierState.PURIFYING_AIR
          : this.CHARACTERISTICS.CurrentAirPurifierState.INACTIVE,
      )
      .onSet(async (value: CharacteristicValue) =>
        this.emit(
          new DeviceCommandEvent(
            {
              action: 'Active',
              deviceId: device.deviceId,
              active: value === this.CHARACTERISTICS.CurrentAirPurifierState.PURIFYING_AIR,
            }),
        ),
      );
    const fanSpeed = (device as unknown as FanSpeedState)?.fanSpeed ?? 0;
    service
      .getCharacteristic(this.CHARACTERISTICS.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
      })
      .updateValue(
        fanSpeed === 16
          ? 25
          : ((fanSpeed + 1) * 25))
      .onSet(async (value: CharacteristicValue) =>
        this.emit(
          new DeviceCommandEvent(
            {
              action: 'FanSpeed',
              deviceId: device.deviceId,
              fanSpeed: Math.max(Math.ceil((value as number ?? 0) / 25) - 1, 0) || 16,
            }),
        ),
      );
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    const fanSpeed = (device as unknown as FanSpeedState).fanSpeed ?? 0;
    console.log('FANSPEED', fanSpeed, device);
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
          : this.CHARACTERISTICS.CurrentAirPurifierState.INACTIVE,
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.Active)
      .updateValue(
        ((device as unknown as ActiveState)?.isActive ?? false)
          ? this.CHARACTERISTICS.Active.ACTIVE
          : this.CHARACTERISTICS.Active.INACTIVE,
      );
  }
}
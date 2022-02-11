import {AccessoryService} from './AccessoryService';
import {Inject} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {ActiveState} from '../../../devices/states/Active';
import {FanSpeedState} from '../../../devices/states/FanSpeed';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';
import {DeviceActiveTransition} from '../../../core/structures/devices/transitions/DeviceActiveTransition';
import {DeviceFanSpeedTransition} from '../../../core/structures/devices/transitions/DeviceFanSpeedTransition';
import {LoggingService} from '../../../logging/LoggingService';
import {ControlLockState} from '../../../devices/states/ControlLock';
import {DeviceControlLockTransition} from '../../../core/structures/devices/transitions/DeviceControlLockTransition';
import {ServiceRegistry} from '../ServiceRegistry';
import {GoveeAirPurifier} from '../../../devices/GoveeAirPurifier';

@ServiceRegistry.register
export class PurifierService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.AirPurifier;

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

  protected supports(device: GoveeDevice): boolean {
    return device instanceof GoveeAirPurifier;
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    service
      .getCharacteristic(this.CHARACTERISTICS.LockPhysicalControls)
      .updateValue(
        (device as unknown as ControlLockState).areControlsLocked
          ? this.CHARACTERISTICS.LockPhysicalControls.CONTROL_LOCK_ENABLED
          : this.CHARACTERISTICS.LockPhysicalControls.CONTROL_LOCK_DISABLED)
      .onSet(
        async (value: CharacteristicValue) =>
          this.emit(
            new DeviceCommandEvent(
              new DeviceControlLockTransition(
                device.deviceId,
                value === this.CHARACTERISTICS.LockPhysicalControls.CONTROL_LOCK_ENABLED,
              ),
            ),
          ),
      );
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
            new DeviceActiveTransition(
              device.deviceId,
              value === this.CHARACTERISTICS.Active.ACTIVE,
            ),
          ),
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
            new DeviceActiveTransition(
              device.deviceId,
              value === this.CHARACTERISTICS.CurrentAirPurifierState.PURIFYING_AIR,
            ),
          ),
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
            new DeviceFanSpeedTransition(
              device.deviceId,
              Math.max(Math.ceil((value as number ?? 0) / 25) - 1, 0) || 16,
            ),
          ),
        ),
      );
  }
}
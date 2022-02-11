import {AccessoryService} from './AccessoryService';
import {Inject, Injectable} from '@nestjs/common';
import {PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES} from '../../../util/const';
import {Characteristic, CharacteristicValue, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {ActiveState} from '../../../devices/states/Active';
import {MistLevelState} from '../../../devices/states/MistLevel';
import {EventEmitter2} from '@nestjs/event-emitter';
import {DeviceCommandEvent} from '../../../core/events/devices/DeviceCommand';
import {DeviceActiveTransition} from '../../../core/structures/devices/transitions/DeviceActiveTransition';
import {DeviceMistLevelTransition} from '../../../core/structures/devices/transitions/DeviceMistLevelTransition';
import {StatusModeState} from '../../../devices/states/StatusMode';
import {LoggingService} from '../../../logging/LoggingService';
import {ControlLockState} from '../../../devices/states/ControlLock';
import {DeviceControlLockTransition} from '../../../core/structures/devices/transitions/DeviceControlLockTransition';

@Injectable()
export class HumidifierService extends AccessoryService {
  protected readonly ServiceType: WithUUID<typeof Service> = this.SERVICES.HumidifierDehumidifier;

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
    return Reflect.has(device, 'mistLevel');
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
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
      .getCharacteristic(this.CHARACTERISTICS.WaterLevel)
      .setProps({
        validValues: [0, 100],
      })
      .updateValue(
        ((device as unknown as StatusModeState).statusMode === 4)
          ? 0
          : 100);
    service
      .getCharacteristic(this.CHARACTERISTICS.LockPhysicalControls)
      .updateValue(
        (device as unknown as ControlLockState).areControlsLocked
          ? this.CHARACTERISTICS.LockPhysicalControls.CONTROL_LOCK_ENABLED
          : this.CHARACTERISTICS.LockPhysicalControls.CONTROL_LOCK_DISABLED);
    service
      .getCharacteristic(this.CHARACTERISTICS.CurrentHumidifierDehumidifierState)
      .setProps({
        validValues: [
          this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.INACTIVE,
          this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.HUMIDIFYING,
        ],
      })
      .updateValue(
        (
          ((device as unknown as ActiveState).isActive
            && ((device as unknown as MistLevelState)?.mistLevel ?? 0) > 0
            && ((device as unknown as StatusModeState)?.statusMode ?? 0) !== 4))
          ? this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.HUMIDIFYING
          : this.CHARACTERISTICS.CurrentHumidifierDehumidifierState.INACTIVE,
      );
    service
      .getCharacteristic(this.CHARACTERISTICS.Active)
      .updateValue(
        (
          ((device as unknown as ActiveState).isActive ?? false)
          && ((device as unknown as StatusModeState)?.statusMode ?? 0) !== 4)
          ? this.CHARACTERISTICS.Active.ACTIVE
          : this.CHARACTERISTICS.Active.INACTIVE,
      )
      .onSet(
        async (value: CharacteristicValue) =>
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
      .getCharacteristic(this.CHARACTERISTICS.RelativeHumidityHumidifierThreshold)
      .setProps({
        minValue: 0,
        maxValue: 100,
      })
      .updateValue(((device as unknown as MistLevelState).mistLevel ?? 0) / 8 * 100)
      .onSet(
        async (value: CharacteristicValue) =>
          this.emit(
            new DeviceCommandEvent(
              new DeviceMistLevelTransition(
                device.deviceId,
                Math.ceil((value as number || 0) / 12.5),
              ),
            ),
          ),
      );
  }
}
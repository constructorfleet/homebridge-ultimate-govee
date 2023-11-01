import { AccessoryService } from './AccessoryService';
import { Inject } from '@nestjs/common';
import { PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES } from '../../../util/const';
import { Characteristic, CharacteristicValue, PlatformAccessory, Service, UnknownContext, WithUUID } from 'homebridge';
import { GoveeDevice } from '../../../devices/GoveeDevice';
import { ActiveState } from '../../../devices/states/Active';
import { FanSpeedState } from '../../../devices/states/FanSpeed';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeviceCommandEvent } from '../../../core/events/devices/DeviceCommand';
import { DeviceActiveTransition } from '../../../core/structures/devices/transitions/DeviceActiveTransition';
import { DeviceFanSpeedTransition } from '../../../core/structures/devices/transitions/DeviceFanSpeedTransition';
import { LoggingService } from '../../../logging/LoggingService';
import { ControlLockState } from '../../../devices/states/ControlLock';
import { DeviceControlLockTransition } from '../../../core/structures/devices/transitions/DeviceControlLockTransition';
import { GoveeAirPurifier, GoveeAirPurifierLite } from '../../../devices/implementations/GoveeAirPurifier';
import { PlatformConfigService } from '../../config/PlatformConfigService';
import { ServiceRegistry } from '../ServiceRegistry';
import { SimpleFanSpeedState } from '../../../devices/states/SimpleFanSpeed';
import { DeviceSimpleFanSpeedTransition } from '../../../core/structures/devices/transitions/DeviceSimpleFanSpeedTransition';

@ServiceRegistry.register(
  GoveeAirPurifier,
  GoveeAirPurifierLite,
)
export class PurifierService extends AccessoryService<void, typeof Service.AirPurifier> {
  protected readonly serviceType: WithUUID<typeof Service.AirPurifier> = this.SERVICES.AirPurifier;

  constructor(
    eventEmitter: EventEmitter2,
    platformConfig: PlatformConfigService,
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    log: LoggingService,
  ) {
    super(
      eventEmitter,
      platformConfig,
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }

  protected override addServiceTo(
    accessory: PlatformAccessory<UnknownContext>,
  ): Service | undefined {
    return accessory.addService(
      this.serviceType,
      accessory.displayName,
    );
  }

  protected supports(device: GoveeDevice): boolean {
    return device instanceof GoveeAirPurifier || device instanceof GoveeAirPurifierLite;
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
    const goveeFanSpeed = 'simpleFanSpeed' in device
      ? (device as unknown as SimpleFanSpeedState).simpleFanSpeed
      : 'fanSpeed' in device
        ? (device as unknown as FanSpeedState).fanSpeed
        : undefined;
    if (goveeFanSpeed === undefined) {
      return;
    }

    const isSimpleFanSpeed = 'simpleFanSpeed' in device;
    const fromPercentage: (number) => number = device['fromPercentage'];

    service
      .getCharacteristic(this.CHARACTERISTICS.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
      })
      .updateValue(
        isSimpleFanSpeed
          ? (device as unknown as SimpleFanSpeedState).asPercentage()
          : (device as unknown as FanSpeedState).asPercentage())
      .onSet(async (value: CharacteristicValue) =>
        this.emit(
          new DeviceCommandEvent(
            isSimpleFanSpeed
              ? new DeviceSimpleFanSpeedTransition(
                device.deviceId,
                fromPercentage(value as number ?? 0)
              )
              : new DeviceFanSpeedTransition(
                device.deviceId,
                fromPercentage(value as number ?? 0)
              ),
          ),
        ),
      );
  }
}
import { Characteristic, Service, WithUUID } from 'hap-nodejs';
import { Purifier, PurifierDevice } from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { Type } from '@nestjs/common';
import { CharacteristicHandler } from '../characteristic.handler';
import { HandlerRegistry } from '../handler.registry';

@HandlerRegistry.forDevice(PurifierDevice)
export class PurififerServiceHandler extends ServiceHandler<
  Purifier,
  WithUUID<Service>
> {
  readonly serviceType = Service.AirPurifier;
  readonly isPrimary: boolean = true;
  readonly handlers: Record<
    keyof Purifier,
    CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>[]
  > = {
    power: [],
    isConnected: [],
    isActive: [
      {
        characteristic: Characteristic.Active,
        updateValue: (value) =>
          value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
        onSet: (value) => value === Characteristic.Active.ACTIVE,
      },
    ],
    displaySchedule: [],
    manualMode: [],
    customMode: [],
    timer: [],
    fanSpeed: [
      {
        characteristic: Characteristic.RotationSpeed,
        updateValue: (value) => value as number,
        onSet: (value) => value as number,
      },
    ],
    nightLight: [],
    controlLock: [
      {
        characteristic: Characteristic.LockPhysicalControls,
        updateValue: (value) =>
          value
            ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
        onSet: (value) =>
          value === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
      },
    ],
    mode: [],
    filterExpired: [],
    filterLife: [],
  };
}

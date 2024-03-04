import { Characteristic, Service, WithUUID } from 'hap-nodejs';
import { Humidifier, HumidifierDevice } from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { Type } from '@nestjs/common';
import { CharacteristicHandler } from '../characteristic.handler';
import { HandlerRegistry } from '../handler.registry';

@HandlerRegistry.forDevice(HumidifierDevice)
export class PurififerServiceHandler extends ServiceHandler<
  Humidifier,
  WithUUID<Service>
> {
  readonly serviceType = Service.AirPurifier;
  readonly isPrimary: boolean = true;
  readonly handlers: Record<
    keyof Humidifier,
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
    manualMode: [],
    customMode: [],
    timer: [],
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
    mistLevel: [],
    autoMode: [],
    targetHumidity: [
      {
        characteristic: Characteristic.TargetRelativeHumidity,
        configure: (value) => {
          const rangeValue = value as unknown as {
            range?: { min?: number; max?: number };
          };
          if (
            rangeValue === undefined ||
            rangeValue.range?.min === undefined ||
            rangeValue.range?.max === undefined
          ) {
            return {};
          }
          return {
            minValue: rangeValue.range.min,
            maxValue: rangeValue.range.max,
          };
        },
        updateValue: (value) => value as number,
      },
    ],
    isUVCActive: [],
    humidity: [
      {
        characteristic: Characteristic.CurrentRelativeHumidity,
        configure: (value) => {
          const rangeValue = value as unknown as {
            range?: { min?: number; max?: number };
          };
          if (
            rangeValue === undefined ||
            rangeValue.range?.min === undefined ||
            rangeValue.range?.max === undefined
          ) {
            return {};
          }
          return {
            minValue: rangeValue.range.min,
            maxValue: rangeValue.range.max,
          };
        },
        updateValue: (value) => value as number,
      },
    ],
    waterShortage: [
      {
        characteristic: Characteristic.WaterLevel,
        configure: () => ({
          minValue: 0,
          maxValue: 100,
        }),
        updateValue: (value) => (value ? 0 : 100),
      },
    ],
  };
}

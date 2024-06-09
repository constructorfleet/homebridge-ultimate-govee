import { ServiceHandler } from '../service.handler';

import { CharacteristicHandler } from '../handler.types';
import { WithUUID, Service, Characteristic } from 'hap-nodejs';
import { Type } from '@nestjs/common';
import {
  Device,
  IceMaker,
  IceMakerDevice,
  IceMakerStatus,
  IceMakerStatusStateName,
  MakingIceStateName,
  NuggetSizeStateName,
  TemperatureStateName,
} from '@constructorfleet/ultimate-govee';
import { HandlerRegistry } from '../handler.registry';

type MeasurementData = {
  range?: {
    min: number;
    max: number;
  };
  calibration?: number;
  raw?: number;
  current?: number;
};

const toSpeed = (device: Device & IceMaker, size): number => {
  switch (size) {
    case device.NuggetSize.SMALL:
      return 33;
    case device.NuggetSize.MEDIUM:
      return 66;
    case device.NuggetSize.LARGE:
      return 100;
    default:
      return 0;
  }
};
const toSize = (device: Device & IceMaker, speed: number) => {
  if (speed <= 33) {
    return device.NuggetSize.SMALL;
  }
  if (speed <= 66) {
    return device.NuggetSize.MEDIUM;
  }
  return device.NuggetSize.LARGE;
};

@HandlerRegistry.forDevice(IceMakerDevice)
export class IceMakerHeaderCoolerServiceHandler extends ServiceHandler<
  Omit<IceMaker, 'NuggetSize'>
> {
  readonly serviceType = Service.HeaterCooler;
  readonly isPrimary: boolean = true;
  readonly handlers: Record<
    keyof Omit<IceMaker, 'NuggetSize'>,
    CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>[]
  > = {
    [IceMakerStatusStateName]: [
      {
        characteristic: Characteristic.CurrentHeaterCoolerState,
        updateValue: (value) => {
          switch (value) {
            case IceMakerStatus.FULL:
            case IceMakerStatus.WASHING:
              return Characteristic.CurrentHeaterCoolerState.INACTIVE;
            case IceMakerStatus.MAKING_ICE:
              return Characteristic.CurrentHeaterCoolerState.COOLING;
            default:
              return Characteristic.CurrentHeaterCoolerState.IDLE;
          }
        },
      },
    ],
    [MakingIceStateName]: [
      {
        characteristic: Characteristic.Active,
        updateValue: (value) =>
          value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
        onSet: (value) => value === Characteristic.Active.ACTIVE,
      },
    ],
    [NuggetSizeStateName]: [
      {
        characteristic: Characteristic.RotationSpeed,
        updateValue: (value, { accessory }) =>
          toSpeed(accessory.device as Device & IceMaker, value),
        onSet: (value, { accessory }) =>
          toSize(accessory.device as Device & IceMaker, value as number),
      },
    ],
    [TemperatureStateName]: [
      {
        characteristic: Characteristic.CurrentTemperature,
        configure: (value) => {
          const measurementData = value as MeasurementData;
          return measurementData?.range?.min !== undefined &&
            measurementData?.range?.max !== undefined
            ? {
                minValue: measurementData.range.min,
                measurementData: measurementData.range.max,
              }
            : { undefined };
        },
        updateValue: (value) => (value as MeasurementData)?.current,
      },
    ],
    basketFull: [],
    scheduledStart: [],
    power: [],
    isConnected: [],
    isActive: [],
  };
}

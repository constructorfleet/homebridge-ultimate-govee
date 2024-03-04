import { ServiceHandler } from '../service.handler';
import {
  DeviceStatesType,
  IceMaker,
  IceMakerStates,
  MakingIceStateName,
  NuggetSizeStateName,
} from '@constructorfleet/ultimate-govee/dist/domain';
import { CharacteristicHandler } from '../characteristic.handler';
import { WithUUID, Service, Characteristic } from 'hap-nodejs';
import { Type } from '@nestjs/common';
import { Device, IceMakerDevice } from '@constructorfleet/ultimate-govee';

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

export class IceMakerHeaderCoolerServiceHandler extends ServiceHandler<
  IceMakerStates,
  WithUUID<Service>
> {
  readonly serviceType = Service.HeaterCooler;
  readonly isPrimary: boolean = true;
  readonly handlers: Record<
    keyof IceMakerStates,
    CharacteristicHandler<WithUUID<Type<Characteristic>>, unknown>[]
  > = {
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
        updateValue: (value, { device }) =>
          toSpeed(device as Device & IceMaker, value),
        onSet: (value, { device }) =>
          toSize(device as Device & IceMaker, value as number),
      },
    ],
  };
}

import { Device, Optional } from '@constructorfleet/ultimate-govee';
import { Type } from '@nestjs/common';
import {
  Characteristic,
  CharacteristicProps,
  CharacteristicValue,
} from 'hap-nodejs';
import { PartialAllowingNull, Service, WithUUID } from 'homebridge';

export type CharacteristicOnSetHandler<StateType> = (
  value: CharacteristicValue,
  extras: { device: Device<any>; service: Service },
) => Optional<StateType>;
export type ConfigureCharacteristicProps<StateType> = (
  value: StateType,
  extras: { device: Device<any>; service: Service },
) => PartialAllowingNull<CharacteristicProps>;
export type UpateCharacteristicHandler<StateType> = (
  value: StateType,
  extras: { device: Device<any>; service: Service },
) => Optional<CharacteristicValue>;

export type CharacteristicHandlerFunctions =
  | 'updateValue'
  | 'updateProps'
  | 'configure'
  | 'onSet';

export type CharacteristicHandler<
  CharacteristicType extends WithUUID<Type<Characteristic>>,
  StateType = any,
> = {
  characteristic: CharacteristicType & typeof Characteristic;
  updateValue: UpateCharacteristicHandler<StateType>;
  updateProps?: ConfigureCharacteristicProps<StateType>;
  configure?: ConfigureCharacteristicProps<StateType>;
  onSet?: CharacteristicOnSetHandler<StateType>;
};

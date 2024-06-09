import { DeviceStatesType, Optional } from '@constructorfleet/ultimate-govee';
import { Type } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import {
  Characteristic,
  CharacteristicProps,
  CharacteristicValue,
  PartialAllowingNull,
  Service,
  WithUUID,
} from 'homebridge';
import { GoveeAccessory } from '../govee.accessory';

export type CharacteristicOnSetHandler<StateType> = (
  value: CharacteristicValue,
  extras: {
    accessory: GoveeAccessory<any>;
    service: Service;
    characteristic: Characteristic;
  },
) => Optional<StateType>;
export type ConfigureCharacteristicProps<StateType> = (
  value: StateType,
  extras: {
    accessory: GoveeAccessory<any>;
    service: Service;
    characteristic: Characteristic;
  },
) => PartialAllowingNull<CharacteristicProps>;
export type UpateCharacteristicHandler<StateType> = (
  value: StateType,
  extras: {
    accessory: GoveeAccessory<any>;
    service: Service;
    characteristic: Characteristic;
  },
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

export type ServiceName<States extends DeviceStatesType> = (
  accessory: GoveeAccessory<States>,
  subType?: string,
) => string;
export type ServiceSubTypes<States extends DeviceStatesType> = (
  accessory: GoveeAccessory<States>,
) => string[] | undefined;
export type ServiceCharacteristicHandlers<States extends DeviceStatesType> =
  Partial<
    Record<
      keyof States,
      CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
    >
  >;
export type ServiceType = WithUUID<ClassConstructor<WithUUID<Service>>>;
export type ServiceCharacteristicHandlerFactory<
  States extends DeviceStatesType,
> = (
  accessory: GoveeAccessory<States>,
  subType: string,
) => ServiceCharacteristicHandlers<States>;
export type IsServiceEnabled<States extends DeviceStatesType> = (
  accessory: GoveeAccessory<States>,
  subType?: string,
) => boolean;

export type ServiceHandler<States extends DeviceStatesType> = {
  readonly handlers: ServiceCharacteristicHandlers<States>;
  readonly serviceType: ServiceType;
  readonly name: ServiceName<States>;
  readonly isPrimary: boolean;
  readonly isEnabled: IsServiceEnabled<States>;
  readonly subType: string | undefined;
  tearDown: (accessory: GoveeAccessory<States>) => void;
  setup: (accessory: GoveeAccessory<States>) => void;
};

export type ServiceHandlerType<States extends DeviceStatesType> =
  ClassConstructor<ServiceHandler<States>>;

export type SubServiceHandler<States extends DeviceStatesType> =
  ServiceHandler<States>;

export type SubServiceHandlerType<States extends DeviceStatesType> =
  ClassConstructor<SubServiceHandler<States>> & { readonly identifier: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service, Characteristic, CharacteristicValue } from 'hap-nodejs';
import { LowBattery } from './characteristics/low-battery';
import { Device } from '@constructorfleet/ultimate-govee';
import { Temperature } from './characteristics/current-temperature';
import { Humidity } from './characteristics/current-humidity';
import { Active } from './characteristics/Active';
import { mixin } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';

export type OptionalChar = Characteristic | undefined;

export type GoveeService = {
  updateValue<ValueType extends CharacteristicValue>(
    value: ValueType,
    ...characteristics: OptionalChar[]
  ): OptionalChar[];
  setValues(
    values: number[],
    ...characteristics: OptionalChar[]
  ): OptionalChar[];
  setRange(
    minValue: number,
    maxValue: number,
    ...characteristics: OptionalChar[]
  ): OptionalChar[];
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type GoveeServiceConstructor<TService extends Service> = {
  new (device: Device): TService & GoveeService;
};

export const GoveeService = <TService extends Service>(
  serviceType: ClassConstructor<TService>,
): GoveeServiceConstructor<TService> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class ServiceMixIn extends serviceType {
    constructor(device: Device) {
      super(device.name);

      Active(device, this);
      LowBattery(device, this);
      Temperature(device, this);
      Humidity(device, this);
    }

    updateValue<ValueType extends CharacteristicValue>(
      value: ValueType,
      ...characteristics: OptionalChar[]
    ): OptionalChar[] {
      return characteristics.map((char) => char?.updateValue(value));
    }

    setValues(
      values: number[],
      ...characteristics: OptionalChar[]
    ): OptionalChar[] {
      return characteristics.map((char) =>
        char?.setProps({ validValues: values }),
      );
    }

    setRange(
      minValue: number,
      maxValue: number,
      ...characteristics: OptionalChar[]
    ): OptionalChar[] {
      return characteristics.map((char) =>
        char?.setProps({
          minValue,
          maxValue,
        }),
      );
    }
  }

  return mixin(ServiceMixIn) as GoveeServiceConstructor<TService>;
};

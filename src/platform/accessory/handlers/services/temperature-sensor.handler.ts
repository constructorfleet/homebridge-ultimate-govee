import { Characteristic, Service, WithUUID } from 'hap-nodejs';
import {
  AirQualityDevice,
  HygrometerDevice,
  TemperatureState,
  TemperatureStateName,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { Type } from '@nestjs/common';
import { CharacteristicHandler, } from '../handler.types';
import { HandlerRegistry } from '../handler.registry';

type TemperatureDeviceState = {
  [TemperatureStateName]: TemperatureState;
};

@HandlerRegistry.forDevice(HygrometerDevice, AirQualityDevice)
export class TemperatureSensorHandler extends ServiceHandler<TemperatureDeviceState> {
  readonly serviceType = Service.TemperatureSensor;
  readonly handlers: Record<
    keyof TemperatureDeviceState,
    CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
  > = {
    temperature: [
      {
        characteristic: Characteristic.CurrentTemperature,
        configure: (value: { range?: { min?: number; max?: number } }) =>
          value?.range?.min !== undefined && value?.range?.max !== undefined
            ? { minValue: value.range.min, maxValue: value.range.max }
            : {},
        updateValue: (value: { current?: number }) => value?.current as number,
      },
    ],
  };
}
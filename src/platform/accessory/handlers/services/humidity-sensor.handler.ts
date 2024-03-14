import { Characteristic, Service, WithUUID } from 'hap-nodejs';
import {
  AirQualityDevice,
  HumidityState,
  HumidityStateName,
  HygrometerDevice,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { Type } from '@nestjs/common';
import { CharacteristicHandler } from '../handler.types';
import { HandlerRegistry } from '../handler.registry';

type HumidityDeviceState = {
  [HumidityStateName]: HumidityState;
};

@HandlerRegistry.forDevice(HygrometerDevice, AirQualityDevice)
export class HumiditySensorHandler extends ServiceHandler<HumidityDeviceState> {
  readonly serviceType = Service.HumiditySensor;
  readonly handlers: Record<
    keyof HumidityDeviceState,
    CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
  > = {
    [HumidityStateName]: [
      {
        characteristic: Characteristic.CurrentRelativeHumidity,
        configure: (value: { range?: { min?: number; max?: number } }) =>
          value?.range?.min !== undefined && value?.range?.max !== undefined
            ? { minValue: value.range.min, maxValue: value.range.max }
            : {},
        updateValue: (value: { current?: number }) => value?.current as number,
      },
    ],
  };
}

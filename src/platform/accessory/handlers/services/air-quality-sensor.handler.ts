import { Characteristic, Service } from 'hap-nodejs';
import {
  AirQualityDevice,
  AirQualitySensor,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';
import { MeasurementData } from './types';

@HandlerRegistry.forDevice(AirQualityDevice)
export class AirQualitySensorHandler extends ServiceHandler<AirQualitySensor> {
  readonly serviceType = Service.AirQualitySensor;
  readonly handlers = {
    pm25: [
      {
        characteristic: Characteristic.PM2_5Density,
        configure: (value: MeasurementData) =>
          value?.range?.min !== undefined && value?.range?.max !== undefined
            ? { minValue: value.range.min, maxValue: value.range.max }
            : {},
        updateValue: (value: MeasurementData) => value as number,
      },
      {
        characteristic: Characteristic.AirQuality,
        updateValue: (value: MeasurementData) =>
          value?.current !== undefined
            ? Math.ceil(value.current / 250)
            : undefined,
      },
    ],
  };
}

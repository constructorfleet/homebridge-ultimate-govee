import { Characteristic, Service } from 'hap-nodejs';
import {
  AirQualityDevice,
  AirQualitySensor,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';

@HandlerRegistry.forDevice(AirQualityDevice)
export class AirQualitySensorHandler extends ServiceHandler<AirQualitySensor> {
  readonly serviceType = Service.AirQualitySensor;
  readonly handlers = {
    pm25: [
      {
        characteristic: Characteristic.PM2_5Density,
        updateValue: (value: number) => value as number,
      },
      {
        characteristic: Characteristic.AirQuality,
        updateValue: (value: number) => Math.ceil(value / 250),
      },
    ],
  };
}
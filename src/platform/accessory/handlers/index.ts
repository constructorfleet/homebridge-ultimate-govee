import {
  AirQualitySensorHandler,
  PurififerServiceHandler,
  BatteryHandler,
  FilterMaintenanceHandler,
  HumidifierHandler,
  IceMakerHeaderCoolerServiceHandler,
  HumiditySensorHandler,
  LightBulbHandler,
  TemperatureSensorHandler,
} from './services';
import { LightEffectFactory } from './factories';
export * from './handler.registry';
export * from './handler.types';
export const ServiceHandlers = [
  AirQualitySensorHandler,
  PurififerServiceHandler,
  BatteryHandler,
  FilterMaintenanceHandler,
  HumidifierHandler,
  IceMakerHeaderCoolerServiceHandler,
  HumiditySensorHandler,
  LightBulbHandler,
  TemperatureSensorHandler,
];

export const SubServiceFactories = [LightEffectFactory];

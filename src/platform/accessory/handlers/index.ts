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
import {
  DiyEffectFactory,
  LightEffectFactory,
  PreviousFactory,
} from './factories';
import { PresenceOccupancySensorHandler } from './services/occupancy.handler';
import { PresenceMotionSensorHandler } from './services/motion.handler';
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
  PresenceOccupancySensorHandler,
  PresenceMotionSensorHandler,
];

export const SubServiceFactories = [
  LightEffectFactory,
  DiyEffectFactory,
  PreviousFactory,
];

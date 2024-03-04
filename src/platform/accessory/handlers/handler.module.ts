import { Module } from '@nestjs/common';
import { PurififerServiceHandler } from './services/air-purifier.handler';
import { HandlerRegistry } from './handler.registry';
import { TemperatureSensorHandler } from './services/temperature-sensor.handler';
import { HumiditySensorHandler } from './services/humidity-sensor.handler';
import { AirQualitySensorHandler } from './services/air-quality-sensor.handler';
import { BatteryHandler } from './services/battery.handler';
import {
  LightBulbHandler,
  LightStripHandler,
} from './services/light-bulb.handler';
import { FilterMaintenanceHandler } from './services/filter-maintenance.handler';
import { LightEffectHandler } from './services/dynamic/light-effect.handler';

@Module({
  providers: [
    PurififerServiceHandler,
    TemperatureSensorHandler,
    BatteryHandler,
    HumiditySensorHandler,
    AirQualitySensorHandler,
    LightBulbHandler,
    LightStripHandler,
    FilterMaintenanceHandler,
    {
      provide: 'LightEffectHandler',
      useValue: LightEffectHandler,
    },
    HandlerRegistry,
  ],
  exports: [HandlerRegistry],
})
export class HandlerModule {}

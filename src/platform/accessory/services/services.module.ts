import { Module } from '@nestjs/common';
import { GoveeAirQualitySensorService } from './govee-air-quality-sensor-service';
import { GoveeHumidifierService } from './govee-humidifier-service';
import { GoveeHumiditySensorService } from './govee-humidity-sensor-service';
import { GoveeIceMakerService } from './govee-ice-maker-service';
import { GoveePurifierService } from './govee-purifier-service';
import { GoveeTemperatureSensorService } from './govee-temperature-sensor-service';
import { ServiceFactory } from './services.providers';

@Module({
  providers: [
    GoveeAirQualitySensorService,
    GoveeHumidifierService,
    GoveeHumiditySensorService,
    GoveeIceMakerService,
    GoveePurifierService,
    GoveeTemperatureSensorService,
    ServiceFactory
  ],
  exports: [
    GoveeAirQualitySensorService,
    GoveeHumidifierService,
    GoveeHumiditySensorService,
    GoveeIceMakerService,
    GoveePurifierService,
    GoveeTemperatureSensorService,
    ServiceFactory
  ]
})
export class ServicesModule {}
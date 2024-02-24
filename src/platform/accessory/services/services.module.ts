import { Module } from '@nestjs/common';
import { GoveeAirQualitySensorService } from './govee-air-quality-sensor-service';
import { GoveeHumidifierService } from './govee-humidifier-service';
import { GoveeHumiditySensorService } from './govee-humidity-sensor-service';
import { GoveeIceMakerService } from './govee-ice-maker-service';
import { GoveePurifierService } from './govee-purifier-service';
import { GoveeTemperatureSensorService } from './govee-temperature-sensor-service';
import { ServiceRegistry } from './services.registry';

@Module({
  providers: [
    {
      provide: 'Govee.Service.List',
      useValue: [
        GoveeAirQualitySensorService,
        GoveeHumidifierService,
        GoveeHumiditySensorService,
        GoveeIceMakerService,
        GoveePurifierService,
        GoveeTemperatureSensorService,
      ],
    },
    ServiceRegistry,
  ],
  exports: [ServiceRegistry],
})
export class ServicesModule {}

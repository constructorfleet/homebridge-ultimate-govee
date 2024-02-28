import { Module } from '@nestjs/common';
import { GoveeAirQualitySensorService } from './govee-air-quality-sensor-service';
import { GoveeHumidifierService } from './govee-humidifier-service';
import { GoveeHumiditySensorService } from './govee-humidity-sensor-service';
import { GoveeIceMakerService } from './govee-ice-maker-service';
import { GoveePurifierService } from './govee-purifier-service';
import { GoveeTemperatureSensorService } from './govee-temperature-sensor-service';
import { ServiceRegistry } from './services.registry';
import { GoveeInformationService } from './govee-information.service';
import { LoggerModule } from '../../../logger';
import { GoveeFilterService } from './govee-filter-service';
import { GoveeBatteryService } from './govee-battery.service';

@Module({
  imports: [LoggerModule.deferred()],
  providers: [
    {
      provide: 'Govee.Service.List',
      useValue: [
        GoveeBatteryService,
        GoveeInformationService,
        GoveeAirQualitySensorService,
        GoveeHumidifierService,
        GoveeHumiditySensorService,
        GoveeIceMakerService,
        GoveePurifierService,
        GoveeFilterService,
        GoveeTemperatureSensorService,
      ],
    },
    ServiceRegistry,
  ],
  exports: [ServiceRegistry],
})
export class ServicesModule {}

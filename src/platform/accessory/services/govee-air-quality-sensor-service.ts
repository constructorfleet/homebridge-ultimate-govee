import { ServiceRegistry } from './services.registry';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import {
  AirQualitySensor,
  AirQualityDevice,
  Device,
  PM25StateName,
} from '@constructorfleet/ultimate-govee';
import { Subscription } from 'rxjs';
import { Optional } from '@constructorfleet/ultimate-govee/dist/common';

@ServiceRegistry.register(AirQualityDevice)
export class GoveeAirQualitySensorService extends GoveeService(
  Service.AirQualitySensor,
  true,
  PM25StateName,
) {
  static readonly UUID = Service.AirQualitySensor.UUID;
  readonly UUID = Service.AirQualitySensor.UUID;

  constructor(device: Device & AirQualitySensor) {
    super(device);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.subscribeToState(PM25StateName, Characteristic.PM2_5Density),
      this.subscribeToState(PM25StateName, Characteristic.AirQuality, (value) =>
        Math.ceil(value / 250),
      ),
    ].filter((sub) => sub !== undefined);
  }
}

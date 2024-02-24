import { ServiceRegistry } from './services.registry';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { AirQualitySensor, Device } from '@constructorfleet/ultimate-govee';
import { AirQualityDevice } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/home-improvement/air-quality/air-quality';

@ServiceRegistry.register(AirQualityDevice)
export class GoveeAirQualitySensorService extends GoveeService(
  Service.AirQualitySensor,
) {
  constructor(device: Device & AirQualitySensor) {
    super(device);
    const [pm25Char] = [this.getCharacteristic(Characteristic.PM2_5Density)];
    if (device.pm25?.value !== undefined) {
      this.updateValue(device.pm25.value, pm25Char);
    }

    device.pm25?.subscribe((value) => {
      this.updateValue(value as number, pm25Char);
    });
  }
}

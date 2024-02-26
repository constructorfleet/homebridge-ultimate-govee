import { ServiceRegistry } from './services.registry';
import {
  Device,
  TemperatureState,
  ActiveState,
  BatteryLevelState,
} from '@constructorfleet/ultimate-govee';
import { Service } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { HygrometerDevice } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/home-improvement/hygrometer/hygrometer';

export type TemperatureSensor = {
  temperature: TemperatureState;
  isActive?: ActiveState;
  batteryLevel?: BatteryLevelState;
};

@ServiceRegistry.register(HygrometerDevice)
export class GoveeTemperatureSensorService extends GoveeService(
  Service.TemperatureSensor,
) {
  static readonly UUID = Service.TemperatureSensor.UUID;
  constructor(device: Device & TemperatureSensor) {
    super(device);
  }
}

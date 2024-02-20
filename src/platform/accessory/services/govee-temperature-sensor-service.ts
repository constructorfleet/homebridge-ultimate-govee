import {
  Device,
  TemperatureState,
  ActiveState,
  BatteryLevelState,
} from '@constructorfleet/ultimate-govee';
import { Service } from 'hap-nodejs';
import { GoveeService } from './govee-service';

export type TemperatureSensor = {
  temperature: TemperatureState;
  isActive?: ActiveState;
  batteryLevel?: BatteryLevelState;
};

export class GoveeTemperatureSensorService extends GoveeService(
  Service.TemperatureSensor,
) {
  constructor(device: Device & TemperatureSensor) {
    super(device);
  }
}

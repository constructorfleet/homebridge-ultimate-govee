import {
  Device,
  ActiveState,
  BatteryLevelState,
  HumidityState,
} from '@constructorfleet/ultimate-govee';
import { Service } from 'hap-nodejs';
import { GoveeService } from './govee-service';

export type HumiditySensor = {
  humidity?: HumidityState;
  active?: ActiveState;
  batteryLevel?: BatteryLevelState;
};

export class GoveeHumiditySensorService extends GoveeService(
  Service.HumiditySensor,
) {
  constructor(device: Device & HumiditySensor) {
    super(device);
  }
}

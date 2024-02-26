import { ServiceRegistry } from './services.registry';
import {
  Device,
  ActiveState,
  BatteryLevelState,
  HumidityState,
} from '@constructorfleet/ultimate-govee';
import { Service } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { HygrometerDevice } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/home-improvement/hygrometer/hygrometer';

export type HumiditySensor = {
  humidity?: HumidityState;
  active?: ActiveState;
  batteryLevel?: BatteryLevelState;
};

@ServiceRegistry.register(HygrometerDevice)
export class GoveeHumiditySensorService extends GoveeService(
  Service.HumiditySensor,
) {
  static readonly UUID = Service.HumiditySensor.UUID;
  constructor(device: Device & HumiditySensor) {
    super(device);
  }
}

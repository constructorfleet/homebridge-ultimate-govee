import { ServiceRegistry } from './services.registry';
import {
  Device,
  ActiveState,
  BatteryLevelState,
  HumidityState,
  HumidityStateName,
  HygrometerDevice,
  Optional,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { Subscription } from 'rxjs';

export type HumiditySensor = {
  humidity?: HumidityState;
  active?: ActiveState;
  batteryLevel?: BatteryLevelState;
};

@ServiceRegistry.register(HygrometerDevice)
@ServiceRegistry.registerForStateNames(HumidityStateName)
export class GoveeHumiditySensorService extends GoveeService(
  Service.HumiditySensor,
  false,
  HumidityStateName,
) {
  static readonly UUID = Service.HumiditySensor.UUID;
  readonly UUID = Service.HumiditySensor.UUID;

  constructor(device: Device & HumiditySensor) {
    super(device);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.setCharacteristicProps(
        Characteristic.CurrentRelativeHumidity,
        HumidityStateName,
        (value: { range?: { min?: number; max?: number } }) =>
          value?.range?.min !== undefined && value?.range?.max !== undefined
            ? { maxValue: value.range.max, minValue: value.range.min }
            : {},
      ),
      this.subscribeToState(
        HumidityStateName,
        Characteristic.CurrentRelativeHumidity,
      ),
    ];
  }
}

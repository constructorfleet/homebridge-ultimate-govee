import { ServiceRegistry } from './services.registry';
import {
  Device,
  TemperatureState,
  ActiveState,
  BatteryLevelState,
  TemperatureStateName,
  HygrometerDevice,
  Optional,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { Subscription } from 'rxjs';

export type TemperatureSensor = {
  temperature: TemperatureState;
  isActive?: ActiveState;
  batteryLevel?: BatteryLevelState;
};

@ServiceRegistry.register(HygrometerDevice)
@ServiceRegistry.registerForStateNames(TemperatureStateName)
export class GoveeTemperatureSensorService extends GoveeService(
  Service.TemperatureSensor,
  false,
  TemperatureStateName,
) {
  static readonly UUID = Service.TemperatureSensor.UUID;
  readonly UUID = Service.TemperatureSensor.UUID;

  constructor(device: Device & TemperatureSensor) {
    super(device);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.setCharacteristicProps(
        Characteristic.CurrentTemperature,
        TemperatureStateName,
        (value: { range?: { min?: number; max?: number } }) =>
          value?.range?.max !== undefined && value?.range?.min !== undefined
            ? { maxValue: value.range.max, minValue: value.range.min }
            : {},
      ),
      this.subscribeToState(
        TemperatureStateName,
        Characteristic.CurrentTemperature,
        (value: { current?: number }) => value?.current,
      ),
    ];
  }
}

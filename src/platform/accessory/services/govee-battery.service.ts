import { ServiceRegistry } from './services.registry';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import {
  BatteryLevelState,
  BatteryLevelStateName,
  Device,
} from '@constructorfleet/ultimate-govee';
import { Optional } from '@constructorfleet/ultimate-govee/dist/common';
import { Subscription } from 'rxjs';

export type BatteryDevice = {
  [BatteryLevelStateName]: BatteryLevelState;
};

@ServiceRegistry.registerForStateNames(BatteryLevelStateName)
export class GoveeBatteryService extends GoveeService(
  Service.Battery,
  false,
  BatteryLevelStateName,
) {
  constructor(device: Device & BatteryDevice) {
    super(device);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.setCharacteristicProps(
        Characteristic.BatteryLevel,
        BatteryLevelStateName,
        (value: { range: { min?: number; max?: number } }) =>
          value?.range?.min !== undefined && value?.range?.max !== undefined
            ? { minValue: value.range.min, maxValue: value.range.max }
            : {},
      ),
      this.subscribeToState(BatteryLevelStateName, Characteristic.BatteryLevel),
      this.subscribeToState(
        BatteryLevelStateName,
        Characteristic.StatusLowBattery,
        (value) =>
          value < 15
            ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
      ),
    ];
  }
}

import {
  BatteryLevelState,
  BatteryLevelStateName,
  Device,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';

export type BatteryDevice = {
  batteryLevel?: BatteryLevelState;
};
export const LowBattery = (
  device: Device & BatteryDevice,
  service: Service,
) => {
  const char = service.getCharacteristic(Characteristic.StatusLowBattery);
  if (char === undefined) {
    return;
  }

  if (device[BatteryLevelStateName]?.value !== undefined) {
    char.updateValue(
      device[BatteryLevelStateName].value < 15
        ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
    );
  }
  device[BatteryLevelStateName]?.subscribe((value) => {
    if (value !== undefined) {
      char.updateValue(
        value < 15
          ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
          : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
      );
    }
  });
};

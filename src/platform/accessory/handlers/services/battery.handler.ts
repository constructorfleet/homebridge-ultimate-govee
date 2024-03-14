import { Characteristic, Service } from 'hap-nodejs';
import {
  BatteryLevelState,
  BatteryLevelStateName,
  HygrometerDevice,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';

type BatteryLevelDevice = {
  [BatteryLevelStateName]: BatteryLevelState;
};

@HandlerRegistry.forDevice(HygrometerDevice)
export class BatteryHandler extends ServiceHandler<BatteryLevelDevice> {
  readonly serviceType = Service.Battery;
  readonly handlers = {
    [BatteryLevelStateName]: [
      {
        characteristic: Characteristic.BatteryLevel,
        updateValue: (value: number) => value as number,
      },
      {
        characteristic: Characteristic.StatusLowBattery,
        updateValue: (value: number) =>
          value < 15
            ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
      },
    ],
  };
}
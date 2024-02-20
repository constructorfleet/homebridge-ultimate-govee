import {
  Device,
  HumidityState,
  HumidityStateName,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';

export type HumidityDevice = {
  humidity?: HumidityState;
};

export const Humidity = (device: Device & HumidityDevice, service: Service) => {
  const char = service.getCharacteristic(
    Characteristic.CurrentRelativeHumidity,
  );
  if (char === undefined) {
    return;
  }

  if (device[HumidityStateName]?.value !== undefined) {
    const { min, max } = device[HumidityStateName].value.range;
    if (min !== undefined && max !== undefined) {
      char.setProps({ minValue: min, maxValue: max });
    }
    if (device[HumidityStateName]?.value.current !== undefined) {
      char.updateValue(device[HumidityStateName].value.current);
    }
  }
  device[HumidityStateName]?.subscribe((value) => {
    const { min, max } = value.range;
    if (min !== undefined && max !== undefined) {
      char.setProps({ minValue: min, maxValue: max });
    }
    if (value.current !== undefined) {
      char.updateValue(value.current);
    }
  });
};

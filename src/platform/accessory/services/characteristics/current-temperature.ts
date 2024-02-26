import {
  Device,
  TemperatureState,
  TemperatureStateName,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { Logger } from '@nestjs/common';

export type TemperatureDevice = {
  temperature?: TemperatureState;
};

export const Temperature = (
  device: Device & TemperatureDevice,
  service: Service,
) => {
  const char = service.getCharacteristic(Characteristic.CurrentTemperature);
  if (char === undefined) {
    return;
  }

  if (device[TemperatureStateName]?.value !== undefined) {
    const { min, max } = device[TemperatureStateName].value.range;
    if (min !== undefined && max !== undefined) {
      char.setProps({ minValue: min, maxValue: max });
    }
    if (device[TemperatureStateName]?.value.current !== undefined) {
      char.updateValue(device[TemperatureStateName].value.current);
    }
  }
  device[TemperatureStateName]?.subscribe((value) => {
    const logger = new Logger('Temperature');
    logger.error(value);
    const { min, max } = value.range;
    if (min !== undefined && max !== undefined) {
      char.setProps({ minValue: min, maxValue: max });
    }
    if (value.current !== undefined) {
      char.setValue(value.current);
    }
  });
};

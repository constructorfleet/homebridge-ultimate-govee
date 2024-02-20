import {
  ActiveState,
  ActiveStateName,
  Device,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';

export type ActiveDevice = {
  isActive?: ActiveState;
};

export const Active = (device: Device & ActiveDevice, service: Service) => {
  const char = service.getCharacteristic(Characteristic.Active);
  if (char === undefined) {
    return;
  }

  if (device[ActiveStateName]?.value !== undefined) {
    char.updateValue(
      device[ActiveStateName].value
        ? Characteristic.Active.ACTIVE
        : Characteristic.Active.INACTIVE,
    );
  }

  device[ActiveStateName]?.subscribe((value) => {
    if (value !== undefined) {
      char.updateValue(
        value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
      );
    }
  });

  char.onSet((value) =>
    device[ActiveStateName]?.setState(value === Characteristic.Active.ACTIVE),
  );
};

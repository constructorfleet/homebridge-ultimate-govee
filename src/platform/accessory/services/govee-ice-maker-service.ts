import { ServiceRegistry } from './services.registry';
import { Device, IceMaker } from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { IceMakerDevice } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/appliances/ice-maker/ice-maker';

@ServiceRegistry.register(IceMakerDevice)
export class GoveeIceMakerService extends GoveeService(Service.HeaterCooler) {
  constructor(device: Device & IceMaker) {
    super(device);
    const toSpeed = (size): number => {
      switch (size) {
        case device.NuggetSize.SMALL:
          return 33;
        case device.NuggetSize.MEDIUM:
          return 66;
        case device.NuggetSize.LARGE:
          return 100;
        default:
          return 0;
      }
    };
    const toSize = (speed: number) => {
      if (speed <= 33) {
        return device.NuggetSize.SMALL;
      }
      if (speed <= 66) {
        return device.NuggetSize.MEDIUM;
      }
      return device.NuggetSize.LARGE;
    };
    const [activeChar, stateChar, targetChar, tempChar, sizeChar] = [
      this.getCharacteristic(Characteristic.Active),
      this.getCharacteristic(Characteristic.CurrentHeaterCoolerState),
      this.getCharacteristic(Characteristic.TargetHeaterCoolerState),
      this.getCharacteristic(Characteristic.CurrentTemperature),
      this.getCharacteristic(Characteristic.RotationSpeed),
    ];
    stateChar.setProps({
      validValues: [
        Characteristic.CurrentHeaterCoolerState.COOLING,
        Characteristic.CurrentHeaterCoolerState.IDLE,
        Characteristic.CurrentHeaterCoolerState.INACTIVE,
      ],
    });
    targetChar.setProps({
      validValues: [Characteristic.TargetHeaterCoolerState.COOL],
    });

    this.updateValue(Characteristic.TargetHeaterCoolerState.COOL, targetChar);
    if (device.isActive?.value !== undefined) {
      this.updateValue(
        device.isActive.value
          ? Characteristic.Active.ACTIVE
          : Characteristic.Active.INACTIVE,
        activeChar,
      );
    }
    if (device.makeIce?.value !== undefined) {
      this.updateValue(
        device.makeIce.value
          ? Characteristic.CurrentHeaterCoolerState.COOLING
          : Characteristic.CurrentHeaterCoolerState.IDLE,
        stateChar,
      );
    }
    this.updateValue(0, tempChar);
    if (device.nuggetSize?.value !== undefined) {
      this.updateValue(toSpeed(device.nuggetSize.value), sizeChar);
    }

    device.isActive?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(
          value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
          activeChar,
        );
      }
    });
    device.makeIce?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(
          value
            ? Characteristic.CurrentHeaterCoolerState.COOLING
            : Characteristic.CurrentHeaterCoolerState.IDLE,
          stateChar,
        );
      }
    });
    device.nuggetSize?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(toSpeed(value), sizeChar);
      }
    });

    activeChar.onSet((value) => {
      device.isActive?.setState(value === Characteristic.Active.ACTIVE);
    });
    stateChar.onSet((value) => {
      device.makeIce?.setState(
        value === Characteristic.CurrentHeaterCoolerState.COOLING,
      );
    });
    sizeChar.onSet((value) => {
      device.nuggetSize?.setState(toSize(value as number));
    });
  }
}

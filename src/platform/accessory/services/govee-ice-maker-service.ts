import { ServiceRegistry } from './services.registry';
import {
  ActiveStateName,
  Device,
  IceMaker,
  IceMakerDevice,
  MakingIceStateName,
  NuggetSizeStateName,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { Optional } from '@constructorfleet/ultimate-govee/dist/common';
import { Subscription } from 'rxjs';

const toSpeed = (device: Device & IceMaker, size): number => {
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
const toSize = (device: Device & IceMaker, speed: number) => {
  if (speed <= 33) {
    return device.NuggetSize.SMALL;
  }
  if (speed <= 66) {
    return device.NuggetSize.MEDIUM;
  }
  return device.NuggetSize.LARGE;
};

@ServiceRegistry.register(IceMakerDevice)
export class GoveeIceMakerService extends GoveeService(
  Service.HeaterCooler,
  true,
  NuggetSizeStateName,
  ActiveStateName,
  MakingIceStateName,
) {
  static readonly UUID = Service.HeaterCooler.UUID;
  readonly UUID = Service.HeaterCooler.UUID;

  constructor(device: Device & IceMaker) {
    super(device);
    this.getCharacteristic(Characteristic.CurrentHeaterCoolerState).setProps({
      validValues: [
        Characteristic.CurrentHeaterCoolerState.COOLING,
        Characteristic.CurrentHeaterCoolerState.IDLE,
        Characteristic.CurrentHeaterCoolerState.INACTIVE,
      ],
    });
    this.getCharacteristic(Characteristic.TargetHeaterCoolerState)
      .setProps({
        validValues: [Characteristic.TargetHeaterCoolerState.COOL],
      })
      .updateValue(Characteristic.TargetHeaterCoolerState.COOL);
  }

  setStates() {
    this.setState(Characteristic.RotationSpeed, NuggetSizeStateName, (value) =>
      toSize(this.device as IceMakerDevice, value as number),
    );
    this.setState(
      Characteristic.Active,
      ActiveStateName,
      (value) => value === Characteristic.Active.ACTIVE,
    );
    this.setState(
      Characteristic.CurrentHeaterCoolerState,
      MakingIceStateName,
      (value) => value === Characteristic.CurrentHeaterCoolerState.COOLING,
    );
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.subscribeToState(ActiveStateName, Characteristic.Active, (value) =>
        value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
      ),
      this.subscribeToState(
        MakingIceStateName,
        Characteristic.CurrentHeaterCoolerState,
        (value) =>
          value
            ? Characteristic.CurrentHeaterCoolerState.COOLING
            : Characteristic.CurrentHeaterCoolerState.IDLE,
      ),
      this.subscribeToState(
        NuggetSizeStateName,
        Characteristic.RotationSpeed,
        (value) => toSpeed(this.device as IceMakerDevice, value),
      ),
    ];
  }
}

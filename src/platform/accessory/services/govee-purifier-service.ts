import { ServiceRegistry } from './services.registry';
import {
  ActiveStateName,
  ControlLockStateName,
  Device,
  Purifier,
  PurifierDevice,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { FanSpeedStateName } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/appliances/purifier/purifier.fan-speed';
import { Subscription } from 'rxjs';
import { Optional } from '@constructorfleet/ultimate-govee/dist/common';

@ServiceRegistry.register(PurifierDevice)
export class GoveePurifierService extends GoveeService(
  Service.AirPurifier,
  true,
  ActiveStateName,
  ControlLockStateName,
  FanSpeedStateName,
) {
  static readonly UUID = Service.AirPurifier.UUID;
  readonly UUID = Service.AirPurifier.UUID;

  constructor(device: Device & Purifier) {
    super(device);
  }

  setStates() {
    this.setState(
      Characteristic.Active,
      ActiveStateName,
      (value) => value === Characteristic.Active.ACTIVE,
    );
    this.setState(
      Characteristic.LockPhysicalControls,
      ControlLockStateName,
      (value) =>
        value === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
    );
    this.setState(Characteristic.RotationSpeed, FanSpeedStateName);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.subscribeToState(ActiveStateName, Characteristic.Active, (value) =>
        value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
      ),
      this.subscribeToState(
        ControlLockStateName,
        Characteristic.LockPhysicalControls,
        (value) =>
          value
            ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
      ),
      this.subscribeToState(FanSpeedStateName, Characteristic.RotationSpeed),
    ];
  }
}

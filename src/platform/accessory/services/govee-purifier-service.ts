import { Device, Purifier } from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';

export class GoveePurifierService extends GoveeService(Service.AirPurifier) {
  constructor(device: Device & Purifier) {
    super(device);
    const [lockChar, activeChar, targetStatechar, fanSpeedChar] = [
      this.getCharacteristic(Characteristic.LockPhysicalControls),
      this.getCharacteristic(Characteristic.Active),
      this.getCharacteristic(Characteristic.TargetAirPurifierState),
      this.getCharacteristic(Characteristic.RotationSpeed),
    ];
    if (device.controlLock?.value !== undefined) {
      this.updateValue(
        device.controlLock?.value
          ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
          : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
        lockChar,
      );
    }
    if (device.isActive?.value !== undefined) {
      this.updateValue(
        device.isActive?.value
          ? Characteristic.Active.ACTIVE
          : Characteristic.Active.INACTIVE,
        activeChar,
      );
    }
    this.updateValue(
      Characteristic.TargetAirPurifierState.MANUAL,
      targetStatechar,
    );
    if (device.fanSpeed?.value !== undefined) {
      this.updateValue(device.fanSpeed.value, fanSpeedChar);
    }

    lockChar.onSet((value) =>
      device.controlLock?.setState(
        value === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
      ),
    );
    activeChar.onSet((value) => {
      device.isActive?.setState(
        value === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
      );
    });
    targetStatechar.onSet(() => {
      // no-op
    });
    fanSpeedChar.onSet((value) => {
      device.fanSpeed?.setState(value as number);
    });

    device.controlLock?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(
          value
            ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
          lockChar,
        );
      }
    });
    device.isActive?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(
          value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE,
          activeChar,
        );
      }
    });
    // TODO: Mode
    device.fanSpeed?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(value, fanSpeedChar);
      }
    });
  }
}

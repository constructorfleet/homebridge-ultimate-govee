import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ControlLockState} from '../../../../devices/states/ControlLock';

export class DeviceControlLockTransition extends DeviceTransition<ControlLockState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly controlsLocked: boolean,
  ) {
    super(deviceId);
  }

  protected updateState(device: ControlLockState & GoveeDevice): DeviceControlLockTransition {
    device.areControlsLocked = this.controlsLocked;
    this.commandCodes = device.controlLockChange;
    return this;
  }
}
import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {hexToBase64} from '../../../../util/encodingUtils';
import {ControlLockState} from '../../../../devices/states/ControlLock';

export class DeviceControlLockTransition extends DeviceTransition<ControlLockState & GoveeDevice> {

  constructor(
    deviceId: string,
    private controlsLocked: boolean,
  ) {
    super(deviceId);
  }

  protected updateState(device: ControlLockState & GoveeDevice): string {
    device.areControlsLocked = this.controlsLocked;
    return hexToBase64(device.controlLockChange);
  }
}
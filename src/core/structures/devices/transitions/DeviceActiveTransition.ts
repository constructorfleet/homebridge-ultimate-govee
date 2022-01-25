import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ActiveState} from '../../../../devices/states/Active';
import {hexToBase64} from '../../../../util/encodingUtils';

export class DeviceActiveTransition extends DeviceTransition<ActiveState & GoveeDevice> {

  constructor(
    deviceId: string,
    private active: boolean,
  ) {
    super(deviceId);
  }

  protected updateState(device: ActiveState & GoveeDevice): string {
    device.isActive = this.active;
    return hexToBase64(device.activeStateChange);
  }
}
import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ActiveState} from '../../../../devices/states/Active';

export class DeviceActiveTransition extends DeviceTransition<ActiveState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly active: boolean,
  ) {
    super(deviceId);
  }

  protected updateState(device: ActiveState & GoveeDevice): DeviceActiveTransition {
    device.isActive = this.active;
    this.commandCodes = device.activeStateChange;
    return this;
  }
}
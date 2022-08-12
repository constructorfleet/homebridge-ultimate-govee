import {DeviceTransition} from '../DeviceTransition';
import {MistLevelState} from '../../../../devices/states/MistLevel';
import {GoveeDevice} from '../../../../devices/GoveeDevice';

export class DeviceMistLevelTransition extends DeviceTransition<MistLevelState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly mistLevel: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: MistLevelState & GoveeDevice): DeviceMistLevelTransition {
    device.mistLevel = this.mistLevel;
    this.commandCodes = [device.mistLevelChange];
    return this;
  }
}

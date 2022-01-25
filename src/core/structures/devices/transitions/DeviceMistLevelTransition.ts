import {DeviceTransition} from '../DeviceTransition';
import {MistLevelState} from '../../../../devices/states/MistLevel';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {FanSpeedState} from '../../../../devices/states/FanSpeed';
import {hexToBase64} from '../../../../util/encodingUtils';

export class DeviceMistLevelTransition extends DeviceTransition<MistLevelState & GoveeDevice> {

  constructor(
    deviceId: string,
    private mistLevel: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: MistLevelState & GoveeDevice): string {
    device.mistLevel = this.mistLevel;
    return hexToBase64(device.mistLevelChange);
  }
}
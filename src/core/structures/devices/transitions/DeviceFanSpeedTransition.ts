import {DeviceTransition} from '../DeviceTransition';
import {FanSpeedState} from '../../../../devices/states/FanSpeed';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {hexToBase64} from '../../../../util/encodingUtils';

export class DeviceFanSpeedTransition extends DeviceTransition<FanSpeedState & GoveeDevice> {

  constructor(
    deviceId: string,
    private fanSpeed: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: FanSpeedState & GoveeDevice): string {
    device.fanSpeed = this.fanSpeed;
    return hexToBase64(device.fanSpeedChange);
  }
}
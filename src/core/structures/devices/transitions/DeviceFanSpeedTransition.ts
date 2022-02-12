import {DeviceTransition} from '../DeviceTransition';
import {FanSpeedState} from '../../../../devices/states/FanSpeed';
import {GoveeDevice} from '../../../../devices/GoveeDevice';

export class DeviceFanSpeedTransition extends DeviceTransition<FanSpeedState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly fanSpeed: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: FanSpeedState & GoveeDevice): DeviceFanSpeedTransition {
    device.fanSpeed = this.fanSpeed;
    this.commandCodes = device.fanSpeedChange;
    return this;
  }
}
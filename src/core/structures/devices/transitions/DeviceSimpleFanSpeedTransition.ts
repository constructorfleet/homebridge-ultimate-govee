import { DeviceTransition } from '../DeviceTransition';
import { GoveeDevice } from '../../../../devices/GoveeDevice';
import { SimpleFanSpeedState } from '../../../../devices/states/SimpleFanSpeed';

export class DeviceSimpleFanSpeedTransition extends DeviceTransition<SimpleFanSpeedState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly fanSpeed: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: SimpleFanSpeedState & GoveeDevice): DeviceSimpleFanSpeedTransition {
    device.simpleFanSpeed = this.fanSpeed;
    this.commandCodes = [device.simpleFanSpeedChange];
    return this;
  }
}
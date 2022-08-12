import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {BrightnessState} from '../../../../devices/states/Brightness';

export class DeviceBrightnessTransition extends DeviceTransition<BrightnessState & GoveeDevice> {

  constructor(
      deviceId: string,
      public readonly brightness: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: BrightnessState & GoveeDevice): DeviceBrightnessTransition {
    device.brightness = this.brightness;
    this.commandCodes = [device.brightnessChange];
    return this;
  }
}

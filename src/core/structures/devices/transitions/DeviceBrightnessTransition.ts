import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {hexToBase64} from '../../../../util/encodingUtils';
import {BrightnessState} from '../../../../devices/states/Brightness';

export class DeviceBrightnessTransition extends DeviceTransition<BrightnessState & GoveeDevice> {

  constructor(
    deviceId: string,
    private brightness: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: BrightnessState & GoveeDevice): string {
    device.brightness = this.brightness;
    return hexToBase64(device.brightnessChange);
  }
}
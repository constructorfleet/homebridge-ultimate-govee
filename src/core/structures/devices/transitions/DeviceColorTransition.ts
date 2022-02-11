import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {hexToBase64} from '../../../../util/encodingUtils';
import {ColorRGB} from '../../../../util/colorUtils';
import {SolidColorState} from '../../../../devices/states/SolidColor';

export class DeviceColorTransition extends DeviceTransition<SolidColorState & GoveeDevice> {

  constructor(
    deviceId: string,
    private color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: SolidColorState & GoveeDevice): string {
    device.solidColor = this.color;
    return hexToBase64(device.solidColorChange);
  }
}
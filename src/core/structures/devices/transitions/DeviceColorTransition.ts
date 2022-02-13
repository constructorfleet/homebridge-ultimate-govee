import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {SolidColorState} from '../../../../devices/states/SolidColor';

export class DeviceColorTransition extends DeviceTransition<SolidColorState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: SolidColorState & GoveeDevice): DeviceColorTransition {
    device.solidColor = this.color;
    this.commandCodes = [device.solidColorChange];
    return this;
  }
}
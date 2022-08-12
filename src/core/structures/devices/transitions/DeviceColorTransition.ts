import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {SolidColorState} from '../../../../devices/states/SolidColor';
import {ColorModeState} from '../../../../devices/states/modes/Color';

export class DeviceColorTransition extends DeviceTransition<GoveeDevice> {

  constructor(
      deviceId: string,
      public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: GoveeDevice): DeviceColorTransition {
    const colorState = device as unknown as SolidColorState;
    if (colorState) {
      colorState.solidColor = this.color;
    }

    const colorMode = device as unknown as ColorModeState;
    if (colorMode) {
      colorMode.activeMode = colorMode.colorModeIdentifier;
      colorMode.color = this.color;
    }
    return this;
  }
}

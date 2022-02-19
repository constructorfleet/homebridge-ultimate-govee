import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {SolidColorState} from '../../../../devices/states/SolidColor';
import {ModesState} from '../../../../devices/states/Modes';
import {DeviceMode} from '../../../../devices/states/modes/DeviceMode';
import {SolidColorMode} from '../../../../devices/states/modes/SolidColor';

export class DeviceColorTransition extends DeviceTransition<GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: GoveeDevice): DeviceColorTransition {
    const colorState = device as unknown as SolidColorState;
    const modeState = device as unknown as ModesState;
    if (modeState) {
      const colorMode = Array.from(
        modeState.modes.values(),
      ).find(
        (deviceMode: DeviceMode) => deviceMode instanceof SolidColorMode,
      ) as SolidColorMode;
      colorMode.solidColor = this.color;
      this.commandCodes = [
        modeState.modeChange,
        colorMode.colorChange(),
      ];
    } else if (colorState) {
      colorState.solidColor = this.color;
      this.commandCodes = [colorState.solidColorChange];
    }
    return this;
  }
}
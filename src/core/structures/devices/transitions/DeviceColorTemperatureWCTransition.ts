import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {ModesState} from '../../../../devices/states/Modes';
import {ColorSegmentsModeState} from '../../../../devices/states/modes/ColorSegments';
import {ColorTemperatureState} from '../../../../devices/states/ColorTemperature';
import {ColorModeState} from '../../../../devices/states/modes/Color';

export class DeviceColorTemperatureWCTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly color: ColorRGB,
    public readonly temperature: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceColorTemperatureWCTransition {
    const colorSegmentMode = device as unknown as ColorSegmentsModeState;
    if (colorSegmentMode) {
      colorSegmentMode.colorSegments.forEach(
        (segment) => segment.color.update(this.color),
      );
      return this;
    }

    const colorTemperatureState = device as unknown as ColorTemperatureState;
    if (colorTemperatureState) {
      colorTemperatureState.colorTemperature = this.color;
      colorTemperatureState.temperatureKelvin = this.temperature;
      return this;
    }

    const colorMode = device as unknown as ColorModeState;
    if (colorMode) {
      colorMode.color = this.color;
      return this;
    }
    return this;
  }
}

import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {ModesState} from '../../../../devices/states/Modes';
import {ColorSegmentsModeState} from '../../../../devices/states/modes/ColorSegments';
import {getCommandCodes} from '../../../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../../../util/const';

export class DeviceColorSegmentTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly segmentIndex: number,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceColorSegmentTransition {
    const colorSegmentMode = device as unknown as ColorSegmentsModeState;
    if (!colorSegmentMode) {
      return this;
    }

    device.activeMode = colorSegmentMode.colorSegmentModeIdentifier;
    colorSegmentMode.colorSegments[this.segmentIndex].color.update(this.color);

    this.commandCodes = [
      colorSegmentMode.colorSegmentsChange(this.color, this.segmentIndex),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [5, 1],
      ),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [165],
        1,
      ),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [165],
        2,
      ),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [165],
        3,
      ),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [165],
        4,
      ),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [165],
        5,
      ),
    ];
    return this;
  }
}

export class DeviceBrightnessSegmentTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly segmentIndex: number,
    public readonly brightness: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceBrightnessSegmentTransition {
    const colorSegmentMode = device as unknown as ColorSegmentsModeState;
    if (!colorSegmentMode) {
      return this;
    }

    device.activeMode = colorSegmentMode.colorSegmentModeIdentifier;
    colorSegmentMode.colorSegments[this.segmentIndex].brightness = this.brightness;

    this.commandCodes = [
      colorSegmentMode.brightnessSegmentsChange(this.brightness, this.segmentIndex),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [5, 1],
      ),
    ];
    return this;
  }
}
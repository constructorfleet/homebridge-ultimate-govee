import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ModesState} from '../../../../devices/states/Modes';
import {ColorSegmentsModeState} from '../../../../devices/states/modes/ColorSegments';
import {getCommandCodes} from '../../../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../../../util/const';

export class DeviceBrightnessWCTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly brightness: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceBrightnessWCTransition {
    const colorSegmentMode = device as unknown as ColorSegmentsModeState;
    if (!colorSegmentMode) {
      return this;
    }

    colorSegmentMode.colorSegments.forEach(
      (segment) => segment.brightness = this.brightness,
    );

    this.commandCodes = [
      colorSegmentMode.brightnessSegmentsChange(this.brightness),
      getCommandCodes(
        REPORT_IDENTIFIER,
        [5, 1],
      ),
    ];

    return this;
  }
}
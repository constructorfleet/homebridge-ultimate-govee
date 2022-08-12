import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {ModesState} from '../../../../devices/states/Modes';
import {ColorSegmentsModeState} from '../../../../devices/states/modes/ColorSegments';

export class DeviceColorWCTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceColorWCTransition {
    const colorSegmentMode = device as unknown as ColorSegmentsModeState;
    if (!colorSegmentMode) {
      return this;
    }

    colorSegmentMode.colorSegments.forEach(
      (segment) => segment.color.update(this.color),
    );

    return this;
  }
}

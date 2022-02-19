import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {ModesState} from '../../../../devices/states/Modes';
import {DeviceMode} from '../../../../devices/states/modes/DeviceMode';
import {ColorSegmentsMode} from '../../../../devices/states/modes/ColorSegments';

export class DeviceColorWCTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceColorWCTransition {
    const colorSegmentMode = Array.from(
      device.modes.values(),
    ).find(
      (deviceMode: DeviceMode) => deviceMode instanceof ColorSegmentsMode,
    ) as ColorSegmentsMode;
    if (!colorSegmentMode) {
      return this;
    }

    colorSegmentMode.colorSegments.forEach(
      (segment) => segment.color.update(this.color),
    );

    return this;
  }
}
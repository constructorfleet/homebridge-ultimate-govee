import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {ColorSegmentsState} from '../../../../devices/states/ColorSegments';
import {arrayReplace} from '../../../../util/arrayUtils';

export class DeviceColorSegmentTransition extends DeviceTransition<ColorSegmentsState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly segmentIndex: number,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: ColorSegmentsState & GoveeDevice): DeviceColorSegmentTransition {
    arrayReplace(
      device.colorSegments,
      this.segmentIndex,
      this.color,
    );
    this.commandCodes = device.colorSegmentsChange;
    return this;
  }
}
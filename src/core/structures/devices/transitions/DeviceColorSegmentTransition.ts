import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB} from '../../../../util/colorUtils';
import {ModesState} from '../../../../devices/states/Modes';
import {DeviceMode} from '../../../../devices/states/modes/DeviceMode';
import {ColorSegmentsMode} from '../../../../devices/states/modes/ColorSegments';

export class DeviceColorSegmentTransition extends DeviceTransition<ModesState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly segmentIndex: number,
    public readonly color: ColorRGB,
  ) {
    super(deviceId);
  }

  protected updateState(device: ModesState & GoveeDevice): DeviceColorSegmentTransition {
    const colorSegmentMode = Array.from(
      device.modes.values(),
    ).find(
      (deviceMode: DeviceMode) => deviceMode instanceof ColorSegmentsMode,
    ) as ColorSegmentsMode;
    if (!colorSegmentMode) {
      return this;
    }

    device.activeMode = colorSegmentMode.modeIdentifier;
    colorSegmentMode.colorSegments[this.segmentIndex].color.update(this.color);

    this.commandCodes = [
      device.modeChange,
      colorSegmentMode.colorSegmentsChange(this.color, this.segmentIndex),
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
    const colorSegmentMode = Array.from(
      device.modes.values(),
    ).find(
      (deviceMode: DeviceMode) => deviceMode instanceof ColorSegmentsMode,
    ) as ColorSegmentsMode;
    if (!colorSegmentMode) {
      return this;
    }

    device.activeMode = colorSegmentMode.modeIdentifier;
    colorSegmentMode.colorSegments[this.segmentIndex].brightness = this.brightness;

    this.commandCodes = [
      device.modeChange,
      colorSegmentMode.brightnessSegmentsChange(this.brightness, this.segmentIndex),
    ];
    return this;
  }
}
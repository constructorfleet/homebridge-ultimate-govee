import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB} from '../../util/colorUtils';

const commandIdentifiers = [
  5,
  1,
];

export enum MusicModeType {
  ENERGETIC = 0x00,
  SPECTRUM = 0x01,
  ROLLING = 0x02,
  RHYTHM = 0x03,
}

export interface MusicModeState {
  musicMode?: MusicModeType;
  musicColor?: ColorRGB;

  get musicModeChange(): number[];
}

export function MusicMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements MusicModeState {
    public musicMode?: MusicModeType;
    public musicColor?: ColorRGB;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.musicMode = commandValues[0][0];
        this.musicColor = new ColorRGB(
          commandValues[0][2],
          commandValues[0][3],
          commandValues[0][4],
        );
      }

      return super.parse(deviceState);
    }

    public get musicModeChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.musicMode || 0,
        0x00,
        this.musicColor?.red || 0,
        this.musicColor?.green || 0,
        this.musicColor?.blue || 0,
      );
    }
  };
}
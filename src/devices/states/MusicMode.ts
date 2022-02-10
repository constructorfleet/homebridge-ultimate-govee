import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

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
  musicModeRed?: number;
  musicModeBlue?: number;
  musicModeGreen?: number;

  get musicModeChange(): number[];
}

export function MusicMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements MusicModeState {
    public musicMode?: MusicModeType;
    public musicModeRed?: number;
    public musicModeBlue?: number;
    public musicModeGreen?: number;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.musicMode = commandValues[0];
        this.musicModeRed = commandValues[2];
        this.musicModeGreen = commandValues[3];
        this.musicModeBlue = commandValues[4];
      }

      return super.parse(deviceState);
    }

    public get musicModeChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.musicMode || 0,
        0x00,
        this.musicModeRed || 0,
        this.musicModeGreen || 0,
        this.musicModeBlue || 0,
      );
    }
  };
}
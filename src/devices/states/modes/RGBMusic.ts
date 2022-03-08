import {modeCommandIdentifiers, ModesState} from '../Modes';
import {State} from '../State';
import {GoveeDeviceConstructorArgs} from '../../GoveeDevice';
import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';

export interface RGBMusicModeConstructorArgs {
  rgbMusicModeIdentifier?: number;
}

export interface RGBMusicModeState extends ModesState {
  rgbMusicModeIdentifier?: number;
  musicModeType?: number;
  sensitivity?: number;

  rgbMusicChange(): number[];
}


export function RGBMusicMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements RGBMusicModeState {
    public activeMode?: number;
    public rgbMusicModeIdentifier!: number;
    public musicModeType?: number;
    public sensitivity?: number;

    constructor(args: RGBMusicModeConstructorArgs & GoveeDeviceConstructorArgs) {
      super(args);
      this.addDeviceStatusCodes(modeCommandIdentifiers);
      this.rgbMusicModeIdentifier = args.rgbMusicModeIdentifier ?? 14;
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.mode !== undefined) {
        this.activeMode = deviceState.mode;
      }

      const commandValues = getCommandValues(
        [
          REPORT_IDENTIFIER,
          ...modeCommandIdentifiers,
          this.rgbMusicModeIdentifier,
        ],
        deviceState.commands,
      );

      if (!commandValues || (commandValues?.length || 0) === 0) {
        return super.parse(deviceState);
      }

      this.activeMode = this.rgbMusicModeIdentifier;
      this.musicModeType = commandValues[0][0];
      this.sensitivity = commandValues[0][1];
      return super.parse(deviceState);
    }

    rgbMusicChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        [
          ...modeCommandIdentifiers,
          this.rgbMusicModeIdentifier,
        ],
        this.musicModeType || 0,
        this.sensitivity || 0,
      );
    }
  };
}
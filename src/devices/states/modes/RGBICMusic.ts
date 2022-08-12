import {modeCommandIdentifiers, ModesState} from '../Modes';
import {State} from '../State';
import {DeviceState} from '../../../core';
import {ColorRGB, COMMAND_IDENTIFIER, getCommandCodes, getCommandValues, REPORT_IDENTIFIER} from '../../../util';

export interface RGBICMusicModeConstructorArgs {
  rgbicMusicModeIdentifier?: number;
}

export enum RGBICColorMode {
  AUTOMATIC = 0x00,
  SPECIFIED = 0x01,
}

export enum RGBICIntensityMode {
  DYNAMIC = 0x00,
  CALM = 0x01,
}

export interface RGBICMusicModeState extends ModesState {
  rgbicMusicModeIdentifier?: number;
  musicModeType?: number;
  sensitivity?: number;
  intensity?: RGBICIntensityMode;
  colorMode?: RGBICColorMode;
  specifiedColor: ColorRGB;

  rgbicMusicChange(): number[];
}


export function RGBICMusicMode<StateType extends State>(
    stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements RGBICMusicModeState {
    public activeMode?: number;
    public rgbicMusicModeIdentifier!: number;
    public musicModeType?: number;
    public sensitivity?: number;
    public intensity: RGBICIntensityMode = RGBICIntensityMode.DYNAMIC;
    public colorMode: RGBICColorMode = RGBICColorMode.AUTOMATIC;
    public specifiedColor: ColorRGB =
        new ColorRGB(0, 0, 0);

    constructor(args) {
      super(args);
      this.addDeviceStatusCodes(modeCommandIdentifiers);
      this.rgbicMusicModeIdentifier = args.rgbicMusicModeIdentifier ?? 109;
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.mode !== undefined) {
        this.activeMode = deviceState.mode;
      }

      const commandValues = getCommandValues(
          [
            REPORT_IDENTIFIER,
            ...modeCommandIdentifiers,
            this.rgbicMusicModeIdentifier,
          ],
          deviceState.commands,
      );

      if (!commandValues || (commandValues?.length || 0) === 0) {
        return super.parse(deviceState);
      }

      this.musicModeType = commandValues[0][0];
      this.sensitivity = commandValues[0][1];
      this.intensity = commandValues[0][2];
      this.colorMode = commandValues[0][3];
      this.specifiedColor.red = commandValues[0][4];
      this.specifiedColor.green = commandValues[0][5];
      this.specifiedColor.blue = commandValues[0][6];
      return super.parse(deviceState);
    }

    rgbicMusicChange(): number[] {
      return getCommandCodes(
          COMMAND_IDENTIFIER,
          [
            ...modeCommandIdentifiers,
            this.rgbicMusicModeIdentifier,
          ],
          this.musicModeType || 0,
          this.sensitivity || 0,
          this.intensity,
          this.colorMode,
          this.specifiedColor.red,
          this.specifiedColor.green,
          this.specifiedColor.blue,
      );
    }
  };
}

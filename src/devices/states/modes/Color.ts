import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {ColorRGB} from '../../../util/colorUtils';
import {State} from '../State';
import {modeCommandIdentifiers, ModesState} from '../Modes';
import {GoveeDeviceConstructorArgs} from '../../GoveeDevice';

export interface ColorModeConstructorArgs {
  colorModeIdentifier?: number;
}

export interface ColorModeState extends ModesState {
  color?: ColorRGB;
  colorModeIdentifier: number;

  colorChange(): number[];
}

export function ColorMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ColorModeState {
    public activeMode?: number;
    public modes!: number[];
    public colorModeIdentifier!: number;
    public color?: ColorRGB;

    public constructor(args: ColorModeConstructorArgs & GoveeDeviceConstructorArgs) {
      super(args);
      this.addDeviceStatusCodes(modeCommandIdentifiers);
      this.colorModeIdentifier = args.colorModeIdentifier ?? 2;
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.mode !== undefined) {
        this.activeMode = deviceState.mode;
      }
      const isColorCommand = deviceState.color && (deviceState.command ?? '') in ['color', 'colorwc'];
      const isNoCommandsStatus = deviceState.color && !deviceState.commands;
      if (isColorCommand || isNoCommandsStatus) {
        this.color = new ColorRGB(
          deviceState.color!.red!,
          deviceState.color!.green!,
          deviceState.color!.blue!,
        );

        return super.parse(deviceState);
      }
      const commandValues = getCommandValues(
        [
          REPORT_IDENTIFIER,
          ...modeCommandIdentifiers,
          this.colorModeIdentifier,
        ],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.color = new ColorRGB(
          commandValues[0][0],
          commandValues[0][1],
          commandValues[0][2],
        );
      }

      return super.parse(deviceState);
    }

    public colorChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        modeCommandIdentifiers,
        this.colorModeIdentifier,
        this.color?.red ?? 0,
        this.color?.green ?? 0,
        this.color?.blue ?? 0,
      );
    }
  };
}
import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB} from '../../util/colorUtils';

const commandIdentifiers = [
  5,
  2,
];

export interface SolidColorState {
  solidColor?: ColorRGB;

  get solidColorChange(): number[];
}

export function SolidColor<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements SolidColorState {
    public solidColor?: ColorRGB;

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
        this.solidColor = new ColorRGB(
          commandValues[0],
          commandValues[1],
          commandValues[2],
        );

      }

      return super.parse(deviceState);
    }

    public get solidColorChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.solidColor?.red || 0,
        this.solidColor?.green || 0,
        this.solidColor?.blue || 0,
      );
    }
  };
}
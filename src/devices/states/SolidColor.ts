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

    public get solidColorChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.solidColor?.red || 0,
        this.solidColor?.green || 0,
        this.solidColor?.blue || 0,
        0x00, 0xff, 0xae, 0x54,
      );
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.color !== undefined) {
        this.solidColor = new ColorRGB(
          deviceState.color.red ?? deviceState.color.r ?? 0,
          deviceState.color.green ?? deviceState.color.g ?? 0,
          deviceState.color.blue ?? deviceState.color.b ?? 0,
        );
        return super.parse(deviceState);
      }
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      const solidColorCommandValues = commandValues?.find(
        (cmd) => (cmd[3] || 0) === 0,
      );
      if (solidColorCommandValues) {
        this.solidColor = new ColorRGB(
          solidColorCommandValues[0],
          solidColorCommandValues[1],
          solidColorCommandValues[2],
        );
      }

      return super.parse(deviceState);
    }
  };
}

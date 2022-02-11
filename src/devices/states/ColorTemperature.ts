import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB, kelvinToRGB} from '../../util/colorUtils';

const commandIdentifiers = [
  5,
  2,
  255,
  255,
  255,
  1,
];

export interface ColorTemperatureState {
  solidColor?: ColorRGB;

  get colorTemperatureChange(): number[];
}

export function ColorTemperature<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ColorTemperatureState {
    public solidColor?: ColorRGB;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.colorTemperature !== undefined && deviceState.colorTemperature !== 0) {
        this.solidColor = kelvinToRGB(deviceState.colorTemperature);
        return super.parse(deviceState);
      }

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

    public get colorTemperatureChange(): number[] {
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
import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {ColorRGB, kelvinToRGB, rgbToKelvin} from '../../util/colorUtils';

const commandIdentifiers = [
  5,
  2,
  255,
  255,
  255,
  1,
];

export interface ColorTemperatureState {
  colorTemperature?: ColorRGB;
  temperatureKelvin?: number;

  get colorTemperatureChange(): number[];
}

export function ColorTemperature<StateType extends State>(
    stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ColorTemperatureState {
    public colorTemperature?: ColorRGB;
    public temperatureKelvin?: number;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public get colorTemperatureChange(): number[] {
      return getCommandCodes(
          COMMAND_IDENTIFIER,
          commandIdentifiers,
          this.colorTemperature?.red || 0,
          this.colorTemperature?.green || 0,
          this.colorTemperature?.blue || 0,
      );
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.colorTemperature !== undefined && deviceState.colorTemperature !== 0) {
        this.colorTemperature = kelvinToRGB(deviceState.colorTemperature);
        this.temperatureKelvin = deviceState.colorTemperature;
        return super.parse(deviceState);
      }

      const commandValues = getCommandValues(
          [REPORT_IDENTIFIER, ...commandIdentifiers],
          deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.colorTemperature = new ColorRGB(
            commandValues[0][0],
            commandValues[0][1],
            commandValues[0][2],
        );
        this.temperatureKelvin = rgbToKelvin(this.colorTemperature);
      }

      return super.parse(deviceState);
    }
  };
}

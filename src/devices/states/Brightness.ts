import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

const commandIdentifiers = [
  4,
];

export interface BrightnessState {
  brightness?: number;

  get brightnessChange(): number[];
}

export function Brightness<StateType extends State>(
    stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements BrightnessState {
    public brightness?: number;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public get brightnessChange(): number[] {
      return getCommandCodes(
          COMMAND_IDENTIFIER,
          commandIdentifiers,
          this.brightness || 0,
      );
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.brightness !== undefined) {
        this.brightness = deviceState.brightness;
      }
      const commandValues = getCommandValues(
          [REPORT_IDENTIFIER, ...commandIdentifiers],
          deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.brightness = commandValues[0][0];
      }

      return super.parse(deviceState);
    }
  };
}

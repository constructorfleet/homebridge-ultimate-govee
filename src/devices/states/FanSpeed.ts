import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

const commandIdentifiers = [
  5,
];

export interface FanSpeedState {
  fanSpeed?: number;

  get fanSpeedChange(): number[];
}

export function FanSpeed<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements FanSpeedState {
    public fanSpeed?: number;

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
        this.fanSpeed = commandValues[0];
      }

      return super.parse(deviceState);
    }

    public get fanSpeedChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.fanSpeed || 16,
      );
    }
  };
}
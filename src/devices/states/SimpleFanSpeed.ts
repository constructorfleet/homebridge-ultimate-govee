import { State } from './State';
import { DeviceState } from '../../core/structures/devices/DeviceState';
import { getCommandCodes, getCommandValues } from '../../util/opCodeUtils';
import { COMMAND_IDENTIFIER, REPORT_IDENTIFIER } from '../../util/const';

const commandIdentifiers = [
  5,
  1,
];

export interface SimpleFanSpeedState {
  simpleFanSpeed?: number;

  asPercentage(fanSpeed?: number): number;
  fromPercentage(percent: number): number;
  get simpleFanSpeedChange(): number[];
}

export function SimpleFanSpeed<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements SimpleFanSpeedState {
    public simpleFanSpeed?: number;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public asPercentage(fanSpeed?: number): number {
      return (fanSpeed || this.simpleFanSpeed || 0 ) / 3 * 100;
    }

    public fromPercentage(percent: number): number {
      return Math.max(Math.ceil(percent / 33.3), 1);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.simpleFanSpeed = commandValues[0][0];
      }

      return super.parse(deviceState);
    }

    public get simpleFanSpeedChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.simpleFanSpeed || 1,
      );
    }
  };
}
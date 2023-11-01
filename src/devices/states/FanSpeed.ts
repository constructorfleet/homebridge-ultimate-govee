import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

const commandIdentifiers = [
  5,
];

export interface FanSpeedState {
  fanSpeed?: number;

  asPercentage(fanSpeed?: number): number;
  fromPercentage(percent: number): number;
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

    public asPercentage(fanSpeed?: number): number {
      fanSpeed = fanSpeed ?? this.fanSpeed ?? 0;
      return fanSpeed === 16
        ? 25
        : ((fanSpeed + 1) * 25);
    }

    public fromPercentage(percent: number): number {
      return Math.max(Math.ceil(percent / 25) - 1, 0) || 16;
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.command === 'multiSync') {
        const commandValues = getCommandValues(
          [REPORT_IDENTIFIER, ...commandIdentifiers, 1],
          deviceState.commands,
        );
        if (commandValues?.length === 1) {
          this.fanSpeed = commandValues[0][0];
        }
      } else {
        const commandValues = getCommandValues(
          [REPORT_IDENTIFIER, ...commandIdentifiers],
          deviceState.commands,
        );
        if (commandValues?.length === 1) {
          this.fanSpeed = commandValues[0][0];
        }
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
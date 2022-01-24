import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  5,
];

export interface FanSpeedState {
  fanSpeed?: number;

  get fanSpeedChange(): FanSpeedChange;
}

export interface FanSpeedChange {
  command: number[];
}

export function FanSpeed<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements FanSpeedState {
    public fanSpeed?: number;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.fanSpeed = commandValues[0];
      }

      return super.parse(deviceState);
    }

    public get fanSpeedChange(): FanSpeedChange {
      return {
        command: this.getCommandCodes(
          0x33,
          commandIdentifiers,
          this.fanSpeed || 16,
        ),
      };
    }
  };
}
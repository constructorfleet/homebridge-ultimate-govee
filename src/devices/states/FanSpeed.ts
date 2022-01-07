import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  5,
];

export interface FanSpeedState {
  fanSpeed?: number;
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
  };
}
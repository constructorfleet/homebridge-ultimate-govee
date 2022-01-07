import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  11,
];

export interface TimerState {
  timerOn?: boolean;
  timerDuration?: number;
}

export function Timer<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements TimerState {
    public timerOn?: boolean;
    public timerDuration?: number;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.timerOn = commandValues[0] === 1;
        this.timerDuration = commandValues[1] * 255 + commandValues[2];
      }

      return super.parse(deviceState);
    }
  };
}
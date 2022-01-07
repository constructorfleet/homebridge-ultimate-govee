import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  5,
  0,
];

export interface StatusModeState {
  statusMode?: number;
}

export function StatusMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements StatusModeState {
    public statusMode?: number;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.statusMode = commandValues[0];
      }

      return super.parse(deviceState);
    }
  };
}
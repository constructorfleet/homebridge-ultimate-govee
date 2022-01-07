import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  1,
];

export interface ActiveState {
  isActive?: boolean;
}

export function Active<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ActiveState {
    public isActive?: boolean;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.isActive = commandValues[0] === 1;
      }

      return super.parse(deviceState);
    }
  };
}
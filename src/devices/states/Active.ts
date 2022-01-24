import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  1,
];

export interface ActiveStateChange {
  command: number[];
}

export interface ActiveState {
  isActive?: boolean;

  get activeStateChange(): ActiveStateChange;
}

export function Active<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ActiveState {
    isActive?: boolean;

    public set active(value: boolean) {
      this.isActive = value;
    }

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.on !== undefined) {
        this.isActive = deviceState.on;
        return super.parse(deviceState);
      }
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.isActive = commandValues[0] === 1;
      }

      return super.parse(deviceState);
    }

    public get activeStateChange(): ActiveStateChange {
      return {
        command: this.getCommandCodes(
          0x33,
          commandIdentifiers,
          this.isActive ? 1 : 0,
        ),
      };
    }
  };
}
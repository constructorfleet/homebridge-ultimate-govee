import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  10,
];

export interface ControlLockState {
  areControlsLocked?: boolean;

  get controlLockChange(): number[];
}

export function ControlLock<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ControlLockState {
    public areControlsLocked?: boolean;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.areControlsLocked = commandValues[0] === 1;
      }

      return super.parse(deviceState);
    }

    public get controlLockChange(): number[] {
      return this.getCommandCodes(
        0x33,
        commandIdentifiers,
        this.areControlsLocked ? 1 : 0,
      );
    }
  };
}
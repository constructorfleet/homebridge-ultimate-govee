import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

const commandIdentifiers = [
  5,
  1,
];

export interface MistLevelState {
  mistLevel?: number;

  get mistLevelChange(): number[];
}

export function MistLevel<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements MistLevelState {
    public mistLevel?: number;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = this.getCommandValues(
        [170, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.mistLevel = commandValues[0];
      }

      return super.parse(deviceState);
    }

    public get mistLevelChange(): number[] {
      return this.getCommandCodes(
        0x33,
        commandIdentifiers,
        this.mistLevel || 0,
      );
    }
  };
}
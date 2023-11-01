import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

const commandIdentifiers = [
  5,
  1,
];

export interface MistLevelState {
  mistLevel?: number;
  maxMistLevel: number;

  get mistLevelChange(): number[];
}

export function MistLevel<StateType extends State>(
  maxMistLevel: number,
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements MistLevelState {
    public mistLevel?: number;
    public maxMistLevel: number = maxMistLevel;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.mistLevel = commandValues[0][0];
      }

      return super.parse(deviceState);
    }

    public get mistLevelChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.mistLevel || 0,
      );
    }
  };
}
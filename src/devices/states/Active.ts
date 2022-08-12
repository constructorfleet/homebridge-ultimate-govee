import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';

const commandIdentifiers = [
  1,
];

export interface ActiveState {
  isActive?: boolean;

  get activeStateChange(): number[];
}

export function Active<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ActiveState {
    isActive?: boolean;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public set active(value: boolean) {
      this.isActive = value;
    }

    public get activeStateChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        commandIdentifiers,
        this.isActive ? 1 : 0,
      );
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.on !== undefined) {
        this.isActive = deviceState.on;
        return super.parse(deviceState);
      }
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.isActive = commandValues[0][0] === 1;
      }

      return super.parse(deviceState);
    }
  };
}

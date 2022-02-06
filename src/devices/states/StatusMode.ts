import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandValues} from '../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../util/const';

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
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues) {
        this.statusMode = commandValues[0];
      }

      return super.parse(deviceState);
    }
  };
}
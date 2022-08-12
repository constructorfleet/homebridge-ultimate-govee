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
  subStatusMode?: number;
}

export function StatusMode<StateType extends State>(
    stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements StatusModeState {
    public statusMode?: number;
    public subStatusMode?: number;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.mode !== undefined) {
        this.statusMode = deviceState.mode;
        this.subStatusMode = 0;
        return super.parse(deviceState);
      }
      const commandValues = getCommandValues(
          [REPORT_IDENTIFIER, ...commandIdentifiers],
          deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.statusMode = commandValues[0][0];
        this.subStatusMode = commandValues[0][1];
      }

      return super.parse(deviceState);
    }
  };
}

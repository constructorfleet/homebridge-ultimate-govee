import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandValues} from '../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../util/const';

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
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.timerOn = commandValues[0][0] === 1;
        this.timerDuration = commandValues[0][1] * 255 + commandValues[0][2];
      }

      return super.parse(deviceState);
    }
  };
}
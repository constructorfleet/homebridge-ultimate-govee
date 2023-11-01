import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {FanSpeedState} from './FanSpeed';
import {StatusModeState} from './StatusMode';
import {getCommandValues} from '../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../util/const';

const commandIdentifiers = [
  5,
  2,
];

export interface FanSpeedProgram {
  fanSpeed: number;
  duration: number;
  remaining: number;
}

export interface ProgrammableFanSpeedState {
  fanProgramId?: number;
  fanPrograms: Map<number, FanSpeedProgram>;
}

export function ProgrammableFanSpeed<StateType extends State & FanSpeedState & StatusModeState>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ProgrammableFanSpeedState {
    public fanProgramId?: number;
    public fanPrograms = new Map<number, FanSpeedProgram>();

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      super.parse(deviceState);
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.fanProgramId = Math.floor(commandValues[0][0] / 16);
        for (let i = 0; i < 3; i++) {
          const program: FanSpeedProgram = {
            fanSpeed: commandValues[0][i * 5 + 1],
            duration: commandValues[0][i * 5 + 2] * 255 + commandValues[0][i * 5 + 3],
            remaining: commandValues[0][i * 5 + 4] * 255 + commandValues[0][i * 5 + 5],
          };
          this.fanPrograms.set(i, program);
        }
      }

      if (this.statusMode === 2 && this.fanProgramId !== undefined) {
        this.fanSpeed = this.fanPrograms.get(this.fanProgramId)?.fanSpeed;
      }

      return super.parse(deviceState);
    }
  };
}
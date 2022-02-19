import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../util/const';
import {DeviceMode} from './modes/DeviceMode';

const commandIdentifiers = [
  5,
];

export interface ModesState {
  activeMode?: number;
  modes: Map<number, DeviceMode>;

  get modeChange(): number[];
}

export function Modes(
  ...deviceModeCtors: (new (...args) => DeviceMode)[]
) {
  return function <StateType extends State>(
    stateType: new (...args) => StateType,
  ) {
    // @ts-ignore
    return class extends stateType implements ModesState {
      public activeMode?: number;
      public modes: Map<number, DeviceMode> =
        new Map<number, DeviceMode>(
          deviceModeCtors
            .map(
              (ctor: new (...args) => DeviceMode) => new ctor(),
            )
            .map(
              (deviceMode: DeviceMode) => [deviceMode.modeIdentifier, deviceMode],
            ),
        );

      public constructor(...args) {
        super(...args);
        this.addDeviceStatusCodes(commandIdentifiers);
      }

      public parseModes(deviceState: DeviceState) {
        this.modes.forEach(
          (deviceMode: DeviceMode) => deviceMode.parse(deviceState),
        );
      }

      public override parse(deviceState: DeviceState): ThisType<this> {
        if (deviceState.mode !== undefined) {
          this.activeMode = deviceState.mode;
          this.parseModes(deviceState);
          return super.parse(deviceState);
        }
        const commandValues = getCommandValues(
          [REPORT_IDENTIFIER, ...commandIdentifiers],
          deviceState.commands,
        );
        if (commandValues?.length === 1) {
          this.activeMode = commandValues[0][0];
        }

        this.parseModes(deviceState);
        return super.parse(deviceState);
      }

      public get modeChange(): number[] {
        return getCommandCodes(
          COMMAND_IDENTIFIER,
          commandIdentifiers,
          this.activeMode || 0,
        );
      }
    };
  };
}
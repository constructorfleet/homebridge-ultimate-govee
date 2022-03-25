import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {modeCommandIdentifiers, ModesState} from '../Modes';
import {State} from '../State';

export interface SceneModeConstructorArgs {
  sceneModeIdentifier?: number;
}

export interface SceneModeState extends ModesState {
  sceneModeIdentifier?: number;
  activeSceneId?: number;

  sceneIdChange(): number[];
}

export function SceneMode<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements SceneModeState {
    public activeMode?: number;
    public modes!: number[];
    public sceneModeIdentifier = 4;
    public activeSceneId?: number;

    constructor(args) {
      super(args);
      this.addDeviceStatusCodes(modeCommandIdentifiers);
      this.sceneModeIdentifier = args.sceneModeIdentifier ?? 4;
    }

    public parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.mode !== undefined) {
        this.activeMode = deviceState.mode;
      }

      const commandValues = getCommandValues(
        [
          REPORT_IDENTIFIER,
          ...modeCommandIdentifiers,
          this.sceneModeIdentifier,
        ],
        deviceState.commands,
      );

      if (commandValues?.length === 1) {
        const values = commandValues[0];
        this.activeMode = this.sceneModeIdentifier;
        this.activeSceneId = values[0];
      }

      return super.parse(deviceState);
    }

    public sceneIdChange(): number[] {
      return getCommandCodes(
        COMMAND_IDENTIFIER,
        [
          ...modeCommandIdentifiers,
          this.sceneModeIdentifier,
        ],
        this.activeSceneId ?? 0,
      );
    }
  };
}
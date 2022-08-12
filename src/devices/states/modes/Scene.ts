import {DeviceState} from '../../../core/structures/devices/DeviceState';
import {getCommandCodes, getCommandValues} from '../../../util/opCodeUtils';
import {COMMAND_IDENTIFIER, REPORT_IDENTIFIER} from '../../../util/const';
import {modeCommandIdentifiers, ModesState} from '../Modes';
import {State} from '../State';
import {hexStringToArray} from '../../../util/encodingUtils';

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

      if (commandValues && [1, 2].includes(commandValues.length || 0)) {
        const values = commandValues![0];
        const hex = Buffer.from(
            [values[1] || 0, values[0]],
        ).toString('hex');
        this.activeMode = this.sceneModeIdentifier;

        this.activeSceneId = parseInt(`0x${hex}`);
      }

      return super.parse(deviceState);
    }

    public sceneIdChange(): number[] {
      const sceneIdHex =
          hexStringToArray(
              (this.activeSceneId || 0)
                  .toString(16)
                  .padStart(4, '0')
                  .replace(/(.{2})/g, '$1 '),
          ).reverse();
      return getCommandCodes(
          COMMAND_IDENTIFIER,
          [
            ...modeCommandIdentifiers,
            this.sceneModeIdentifier,
          ],
          ...sceneIdHex,
      );
    }
  };
}

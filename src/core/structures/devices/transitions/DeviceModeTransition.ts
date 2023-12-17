import { DeviceTransition } from '../DeviceTransition';
import { GoveeDevice } from '../../../../devices/GoveeDevice';
import { ModesState } from '../../../../devices/states/Modes';
import { SceneModeState } from '../../../../devices/states/modes/Scene';
import { getCommandCodes } from '../../../../util/opCodeUtils';

export abstract class DeviceModeTransition
  extends DeviceTransition<ModesState & GoveeDevice> {

  protected constructor(
    deviceId: string,
  ) {
    super(deviceId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected updateState(device: ModesState & GoveeDevice): DeviceModeTransition {
    return this;
  }
}

export class DeviceSceneTransition extends DeviceModeTransition {

  constructor(
    deviceId: string,
    private readonly sceneId: number,
  ) {
    super(deviceId);
  }


  protected updateState(device: SceneModeState & GoveeDevice): DeviceModeTransition {
    super.updateState(device);
    const sceneModeState = device as SceneModeState;
    if (!sceneModeState) {
      return this;
    }
    sceneModeState.activeSceneId = this.sceneId;
    // this.commandCodes = [ getCommandCodes(0xa3, [ 0x02 ]), sceneModeState.sceneIdChange() ];
    this.commandCodes = [ getCommandCodes(33, [ 5 ]), getCommandCodes(0xaa, [ 0x05, 0x0a, 0x03 ]) ];

    return super.updateState(device);
  }
}
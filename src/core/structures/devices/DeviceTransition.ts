import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {State} from '../../../devices/states/State';
import {hexToBase64} from '../../../util/encodingUtils';

export abstract class DeviceTransition<StateType extends State & GoveeDevice> {
  protected commandCodes: number[] = [];

  protected constructor(public readonly deviceId: string) {
  }

  public apply(
    device: StateType,
    emitter: Emitter,
  ) {
    device.send(
      this.updateState(device),
      emitter,
    );
  }

  public get opCodeCommand(): number[] {
    return this.commandCodes;
  }

  public get opCodeCommandString(): string {
    return hexToBase64(this.opCodeCommand);
  }

  protected abstract updateState(device: StateType): DeviceTransition<StateType>;
}
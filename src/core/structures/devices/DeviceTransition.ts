import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {State} from '../../../devices/states/State';

export abstract class DeviceTransition<StateType extends State & GoveeDevice> {
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

  protected abstract updateState(device: StateType): string;
}
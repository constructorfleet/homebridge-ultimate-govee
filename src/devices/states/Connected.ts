import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

export interface ConnectedState {
  isConnected?: boolean;
}

export function Connected<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements ConnectedState {
    public isConnected?: boolean;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.connected !== undefined) {
        this.isConnected = deviceState.connected;
      }
      return super.parse(deviceState);
    }
  };
}
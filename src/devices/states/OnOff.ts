import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';

export interface OnOffState {
  isOn?: boolean;
}

export function OnOff<StateType extends State>(
    stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements OnOffState {
    public isOn?: boolean;

    public constructor(...args) {
      super(...args);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (deviceState.on !== undefined) {
        this.isOn = deviceState.on;
      }
      return super.parse(deviceState);
    }
  };
}

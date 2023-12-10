import { State } from './State';
import { DeviceState } from '../../core/structures/devices/DeviceState';

export interface HumidityReadingState {
  humidityReading?: number;
}

export function HumidityReading<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements HumidityReadingState {
    public humidityReading?: number | undefined;

    public override parse(deviceState: DeviceState): ThisType<this> {
      if (!deviceState.status?.codes) {
        return super.parse(deviceState);
      }
      if (deviceState.status.codes.length >= 3) {
        this.humidityReading = deviceState.status.codes[ 2 ];
      }

      return super.parse(deviceState);
    }
  };
}
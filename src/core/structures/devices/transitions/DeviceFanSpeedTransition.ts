import {DeviceTransition} from '../DeviceTransition';

export interface DeviceFanSpeedTransition extends DeviceTransition {
  fanSpeed: number;
}
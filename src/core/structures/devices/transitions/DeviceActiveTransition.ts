import {DeviceTransition} from '../DeviceTransition';

export interface DeviceActiveTransition extends DeviceTransition {
  active: boolean;
}
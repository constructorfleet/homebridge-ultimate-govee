import {DeviceEvent} from './DeviceEvent';
import {DeviceStateTransition} from '../../structures/devices/DeviceStateTransition';

export class DeviceCommandEvent<StateType extends DeviceStateTransition>
  extends DeviceEvent<StateType> {

  constructor(
    command: string,
    eventData: StateType,
  ) {
    super(`Command.${command}`, eventData);
  }
}

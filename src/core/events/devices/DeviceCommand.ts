import {DeviceEvent} from './DeviceEvent';
import {DeviceTransition} from '../../structures/devices/DeviceTransition';

export class DeviceCommandEvent<StateType extends DeviceTransition>
  extends DeviceEvent<StateType> {

  constructor(
    eventData: StateType,
  ) {
    super('Command', eventData);
  }
}

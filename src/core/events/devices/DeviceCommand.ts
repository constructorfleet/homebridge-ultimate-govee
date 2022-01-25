import {DeviceEvent} from './DeviceEvent';
import {DeviceTransition} from '../../structures/devices/DeviceTransition';
import {GoveeDevice} from '../../../devices/GoveeDevice';

export class DeviceCommandEvent<StateType extends DeviceTransition<GoveeDevice>>
  extends DeviceEvent<StateType> {

  constructor(
    eventData: StateType,
  ) {
    super('Command', eventData);
  }
}

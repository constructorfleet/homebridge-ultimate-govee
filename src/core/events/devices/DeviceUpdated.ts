import {DeviceEvent} from './DeviceEvent';
import {GoveeDevice} from '../../../devices/GoveeDevice';

export class DeviceUpdatedEvent
  extends DeviceEvent<GoveeDevice> {

  constructor(eventData: GoveeDevice) {
    super(
      'Updated',
      eventData,
    );
  }
}

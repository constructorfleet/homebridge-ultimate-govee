import {DeviceEvent} from './DeviceEvent';
import {GoveeDevice} from '../../../devices/GoveeDevice';

export class DeviceDiscoveredEvent
  extends DeviceEvent<GoveeDevice> {

  constructor(eventData: GoveeDevice) {
    super(
      'Discovered',
      eventData,
    );
  }
}

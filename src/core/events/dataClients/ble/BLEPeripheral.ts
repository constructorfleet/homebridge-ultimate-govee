import {BLEEvent} from './BLEEvent';
import {Peripheral} from '@abandonware/noble';

export abstract class BLEPeripheralEvent<EventDataType>
  extends BLEEvent<EventDataType> {

  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      `BLE.PERIPHERAL.${eventName}`,
      eventData,
    );
  }
}

export class BLEPeripheralDiscoveredEvent
  extends BLEPeripheralEvent<Peripheral> {


  constructor(eventData: Peripheral) {
    super(
      'Discovered',
      eventData,
    );
  }
}

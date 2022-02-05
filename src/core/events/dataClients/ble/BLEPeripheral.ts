import {BLEDeviceIdentification, BLEEvent} from './BLEEvent';
import {Peripheral} from '@abandonware/noble';
import {ConnectionState} from '../DataClientEvent';
import {BLEPeripheralConnection} from '../../../../data/clients/BLEClient';

export class PeripheralConnectionState extends BLEDeviceIdentification {

  constructor(
    bleAddress: string,
    deviceId: string,
    public connectionState: ConnectionState,
    public connection: BLEPeripheralConnection,
  ) {
    super(bleAddress, deviceId);
  }
}


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

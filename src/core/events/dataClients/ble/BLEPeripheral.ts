import {BLEDeviceIdentification, BLEEvent} from './BLEEvent';
import {ConnectionState} from '../DataClientEvent';

export class BLEPeripheralConnectionState extends BLEDeviceIdentification {
  constructor(
    bleAddress: string,
    deviceId: string,
    public connectionState: ConnectionState,
  ) {
    super(bleAddress.toLowerCase(), deviceId);
  }
}

export class BLEPeripheralStateReceive extends BLEDeviceIdentification {
  constructor(
    bleAddress: string,
    deviceId: string,
    public state: number[],
  ) {
    super(bleAddress.toLowerCase(), deviceId);
  }
}

export class BLEPeripheralCommandSend extends BLEDeviceIdentification {
  constructor(
    bleAddress: string,
    deviceId: string,
    public state: number[],
  ) {
    super(bleAddress.toLowerCase(), deviceId);
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

export class BLEPeripheralConnectionEvent
  extends BLEPeripheralEvent<BLEPeripheralConnectionState> {

  constructor(eventData: BLEPeripheralConnectionState) {
    super(
      'Connection',
      eventData,
    );
  }
}

export class BLEPeripheralReceiveEvent
  extends BLEPeripheralEvent<BLEPeripheralStateReceive> {

  constructor(eventData: BLEPeripheralStateReceive) {
    super(
      'Receive',
      eventData,
    );
  }
}

export class BLEPeripheralSendEvent
  extends BLEPeripheralEvent<BLEPeripheralCommandSend> {

  constructor(eventData: BLEPeripheralCommandSend) {
    super(
      'Send',
      eventData,
    );
  }
}

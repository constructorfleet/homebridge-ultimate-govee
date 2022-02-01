import {ConnectionState, DataClientConnectionStateEvent, DataClientErrorEvent, DataClientEvent} from '../DataClientEvent';

export class BLEDeviceIdentification {
  constructor(
    public readonly bleAddress: string,
    public readonly deviceId: string,
  ) {
  }
}

export class BLEConnectionStateEvent
  extends DataClientConnectionStateEvent {

  constructor(
    eventData: ConnectionState,
  ) {
    super('BLE', eventData);
  }
}

export class BLEErrorEvent
  extends DataClientErrorEvent {

  constructor(
    eventData: (Error | string),
  ) {
    super('BLE', eventData);
  }
}

export abstract class BLEEvent<EventDataType>
  extends DataClientEvent<EventDataType> {

  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      `BLE.${eventName}`,
      eventData,
    );
  }
}
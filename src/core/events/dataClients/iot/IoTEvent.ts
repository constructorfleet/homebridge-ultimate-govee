import {ConnectionState, DataClientConnectionStateEvent, DataClientErrorEvent, DataClientEvent} from '../DataClientEvent';

export class IoTEventData {
  constructor(
    public readonly topic: string,
    public readonly payload: string,
  ) {
  }
}

export class IoTConnectionStateEvent
  extends DataClientConnectionStateEvent {

  constructor(
    eventData: ConnectionState,
  ) {
    super('IOT', eventData);
  }
}

export class IoTErrorEvent
  extends DataClientErrorEvent {

  constructor(
    eventData: (Error | string),
  ) {
    super('IOT', eventData);
  }
}

export abstract class IoTEvent<EventDataType extends IoTEventData>
  extends DataClientEvent<EventDataType> {

  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      `IOT.${eventName}`,
      eventData,
    );
  }
}
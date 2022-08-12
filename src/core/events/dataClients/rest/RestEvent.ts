import {ConnectionState, DataClientConnectionStateEvent, DataClientErrorEvent, DataClientEvent} from '../DataClientEvent';

export class RestConnectionStateEvent
  extends DataClientConnectionStateEvent {

  constructor(
    eventData: ConnectionState,
  ) {
    super('REST', eventData);
  }
}

export class RestErrorEvent
  extends DataClientErrorEvent {

  constructor(
    eventData: (Error | string),
  ) {
    super('REST', eventData);
  }
}

export abstract class RestEvent<EventDataType>
  extends DataClientEvent<EventDataType> {
  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      `REST.${eventName}`,
      eventData,
    );
  }
}

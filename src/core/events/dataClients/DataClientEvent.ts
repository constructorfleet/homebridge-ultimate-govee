import {Event} from '../Event';

export enum ConnectionState {
  Connected,
  Closed,
  Reconnected,
  Offline,
}

export abstract class DataClientEvent<EventDataType>
  extends Event<EventDataType> {

  protected constructor(
    eventName: string,
    eventData?: EventDataType,
  ) {
    super(
      eventName,
      eventData,
    );
  }
}

export abstract class DataClientConnectionStateEvent
  extends DataClientEvent<ConnectionState> {

  protected constructor(
    clientName: string,
    eventData: ConnectionState,
  ) {
    super(
      `${clientName}.CONNECTION`,
      eventData,
    );
  }
}

export abstract class DataClientErrorEvent
  extends DataClientEvent<Error | string> {

  protected constructor(
    clientName: string,
    eventData: (Error | string),
  ) {
    super(
      `${clientName}.ERROR`,
      eventData,
    );
  }
}
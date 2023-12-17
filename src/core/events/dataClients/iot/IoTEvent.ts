import { pfxToBundle } from '../../../../util/p12Utils';
import { ConnectionState, DataClientConnectionStateEvent, DataClientErrorEvent, DataClientEvent } from '../DataClientEvent';

export class IoTEventData {
  constructor(
    public readonly topic: string,
    public readonly payload: string,
  ) {
  }
}

export class IoTInitializeClientData {
  static async build(
    endpoint: string,
    accountId: string,
    goveePfxFile: string,
    p12Password: string,
  ): Promise<IoTInitializeClientData> {
    const bundle = await pfxToBundle(goveePfxFile, p12Password);
    return new IoTInitializeClientData(
      bundle.certificate,
      bundle.privateKey,
      endpoint,
      accountId,
      goveePfxFile,
      p12Password
    );
  }

  constructor(
    public readonly certificate: Buffer,
    public readonly privateKey: Buffer,
    public readonly endpoint: string,
    public readonly accountId: string,
    public readonly goveePfxFile: string,
    public readonly p12Password: string,
  ) { }
}

export class IoTInitializeClientEvent
  extends DataClientEvent<IoTInitializeClientData> {

  constructor(
    eventData: IoTInitializeClientData,
  ) {
    super('IOT.Initialize', eventData);
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
      `IOT.${ eventName }`,
      eventData,
    );
  }
}
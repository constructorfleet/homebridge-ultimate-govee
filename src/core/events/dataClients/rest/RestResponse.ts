import {RestEvent} from './RestEvent';
import {AppDeviceListResponse} from '../../../structures/api/responses/payloads/AppDeviceListResponse';
import {DIYListResponse} from '../../../structures/api/responses/payloads/DIYListResponse';

export abstract class RestResponseEvent<DataType>
  extends RestEvent<DataType> {

  protected constructor(
    eventName: string,
    eventData: DataType,
  ) {
    super(
      `RESPONSE.${eventName}`,
      eventData,
    );
  }
}

export class RestResponseDeviceList
  extends RestResponseEvent<AppDeviceListResponse> {

  constructor(
    eventData: AppDeviceListResponse,
  ) {
    super(
      'DeviceList',
      eventData,
    );
  }
}

export class RestDIYEffectResponse
  extends RestResponseEvent<DIYListResponse> {

  constructor(
    eventData: DIYListResponse,
  ) {
    super(
      'DIYEffects',
      eventData,
    );
  }
}

// export class RestResponseDevice
//   extends RestResponseEvent<string | undefined> {
//
//   constructor(eventData: string | undefined) {
//     super('Device', eventData);
//   }
// }
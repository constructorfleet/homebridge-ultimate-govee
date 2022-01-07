import {RestEvent} from './RestEvent';
import {AppDeviceListResponse} from '../../../../data/structures/api/responses/payloads/AppDeviceListResponse';

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

// export class RestResponseDevice
//   extends RestResponseEvent<string | undefined> {
//
//   constructor(eventData: string | undefined) {
//     super('Device', eventData);
//   }
// }
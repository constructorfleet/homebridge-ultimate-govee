import {RestEvent} from './RestEvent';
import {AppDeviceListResponse} from '../../../structures/api/responses/payloads/AppDeviceListResponse';
import {DIYListResponse} from '../../../structures/api/responses/payloads/DIYListResponse';
import {DeviceSceneListResponse} from '../../../structures/api/responses/payloads/DeviceSceneListResponse';
import {BaseResponse} from '../../../structures/api/responses/payloads/BaseResponse';
import {GoveeDevice} from '../../../../devices/GoveeDevice';

export interface ResponseWithDevice<ResponseType extends BaseResponse> {
  device: GoveeDevice;
  response: ResponseType;
}

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

export class RestDeviceScenesResponse
  extends RestResponseEvent<ResponseWithDevice<DeviceSceneListResponse>> {

  constructor(
    eventData: ResponseWithDevice<DeviceSceneListResponse>,
  ) {
    super(
      'DeviceScenes',
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
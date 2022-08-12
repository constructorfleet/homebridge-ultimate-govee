import {BaseRequest} from './BaseRequest';

export function apiDeviceStateRequest(
    device: string,
    model: string,
): ApiDeviceStateRequest {
  const request = new ApiDeviceStateRequest();
  request.device = device;
  request.model = model;

  return request;
}

export class ApiDeviceStateRequest
    extends BaseRequest {
  public device!: string;
  public model!: string;

  constructor() {
    super();
  }
}

import {BaseRequest} from './BaseRequest';
import {GoveeDevice} from '../../../../../devices/GoveeDevice';

export function deviceSceneRequest(
  device: GoveeDevice,
): DeviceSceneRequest {
  const request = new DeviceSceneRequest();
  request.sku = device.model;
  // request.model = model;

  return request;
}

export class DeviceSceneRequest
  extends BaseRequest {
  constructor() {
    super();
  }

  public sku!: string;

  public goodsType!: number;
}
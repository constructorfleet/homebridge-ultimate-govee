import {BaseRequest} from './BaseRequest';
import {GoveeDevice} from '../../../../../devices/GoveeDevice';

export function deviceSceneRequest(
    device: GoveeDevice,
): DeviceSceneRequest {
  const request = new DeviceSceneRequest();
  request.sku = device.model;
  request.goodsType = device.goodsType;

  return request;
}

export class DeviceSceneRequest
    extends BaseRequest {
  public sku!: string;
  public goodsType!: number;

  constructor() {
    super();
  }
}

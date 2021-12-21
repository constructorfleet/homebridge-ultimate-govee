import {GoveeAirPurifier} from './GoveeAirPurifier';
import {DeviceResponse} from '../data/structures/api/responses/DeviceResponse';
import {GoveeDevice} from './GoveeDevice';
import {ApiDevice} from '../data/structures/api/responses/payloads/ApiDeviceListResponse';

export class DeviceFactory {
  constructor() {
  }

  public from(device: DeviceResponse) {
    switch (device.kind) {
      case 'ApiDevice':
      case 'AppDevice':
      default:
        break;
    }
  }

  private fromApiDevice(device: ApiDevice) {

  }
}
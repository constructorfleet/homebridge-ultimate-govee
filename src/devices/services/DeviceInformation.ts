import {Service} from 'homebridge';
import {GoveeDevice} from '../GoveeDevice';

export interface DeviceInformation {
  addService(
    service: typeof Service.AccessoryInformation,
  ): ThisType<GoveeDevice & typeof Service.AccessoryInformation>;
}
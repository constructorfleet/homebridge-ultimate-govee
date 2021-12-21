import {Service} from 'homebridge';
import {GoveeDevice} from '../GoveeDevice';

export interface AirPurifier {
  addService(
    service: typeof Service.AirPurifier,
  ): ThisType<GoveeDevice & typeof Service.AirPurifier>;
}
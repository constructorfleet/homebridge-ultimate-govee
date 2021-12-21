import {Service} from 'homebridge';
import {GoveeDevice} from '../GoveeDevice';

export interface Fan {
  addService(
    service: typeof Service.Fanv2,
  ): ThisType<GoveeDevice & typeof Service.Fanv2>;
}
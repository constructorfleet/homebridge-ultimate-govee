import {Injectable, Scope} from '@nestjs/common';
import {GoveeDevice} from '../../devices/GoveeDevice';

@Injectable()
export class GoveeAccessoryFactory {
  constructor() {
  }

  get(device: GoveeDevice) {

  }
}
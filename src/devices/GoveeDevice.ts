import {EventEmitter} from 'events';
import {API, PlatformAccessory} from 'homebridge';

export abstract class GoveeDevice extends EventEmitter {
  protected constructor(
    public api: API,
    public accessory: PlatformAccessory,
    public name: string,
    public deviceId: string,
    public model: string,
  ) {
    super();
  }
}
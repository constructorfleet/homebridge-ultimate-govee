import {EventEmitter} from 'events';

export abstract class GoveeClient extends EventEmitter {
  protected constructor() {
    super();
  }
}

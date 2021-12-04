import {Expose} from 'class-transformer';

export class BaseHeaders {
  @Expose({name: 'Content-Type'})
  public contentType = 'application/json';

  @Expose({name: 'Accept'})
  public accept = 'application/json';

  constructor() {
  }
}
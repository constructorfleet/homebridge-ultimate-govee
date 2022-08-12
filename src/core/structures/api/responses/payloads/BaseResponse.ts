import {Expose} from 'class-transformer';

export class BaseResponse {
  @Expose({name: 'message'})
  public message!: string;
  @Expose({name: 'status'})
  public status!: number;

  constructor() {
  }
}

import {Expose} from "class-transformer";

export abstract class BaseResponse {
  @Expose({name: 'message'})
  public message!: string;
  @Expose({name: 'status'})
  public status!: number;
}
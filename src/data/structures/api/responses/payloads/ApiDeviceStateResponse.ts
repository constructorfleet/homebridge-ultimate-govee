import {BaseResponse} from './BaseResponse';
import {Expose, Type} from 'class-transformer';

export class ApiDeviceStateResponse
  extends BaseResponse {
  @Expose({name: 'data'})
  @Type(() => ApiDeviceState)
  public data!: ApiDeviceState;
}

export class ApiDeviceState {
  @Expose({name: 'device'})
  public device!: string;

  @Expose({name: 'model'})
  public model!: string;

  @Expose({name: 'properties'})
  public properties!: Record<string, unknown>[];
}
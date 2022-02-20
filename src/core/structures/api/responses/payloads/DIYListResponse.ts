import {BaseResponse} from './BaseResponse';
import {Expose, Type} from 'class-transformer';
import {AppDeviceResponse} from './AppDeviceListResponse';

export class DIYEffect {
  @Expose({name: 'effectId'})
  public effectId!: string;

  @Expose({name: 'effectCode'})
  public effectCodes!: number[];

  @Expose({name: 'effectStr'})
  public effectCommandString!: string;

  @Expose({name: 'diyName'})
  public name!: string;

  @Expose({name: 'coverUrl'})
  public coverUrl!: string;

  @Expose({name: 'diyCode'})
  public id!: number;

  @Expose({name: 'createTime'})
  public createdTimestamp!: number;

  @Expose({name: 'effectType'})
  public effectType!: number;
}

export class DIYGroup {
  @Expose({name: 'groupId'})
  public groupId!: number;

  @Expose({name: 'groupNames'})
  public groupName!: string;

  @Expose({name: 'diys'})
  @Type(() => DIYEffect)
  public diyEffects!: DIYEffect[];
}

export class DIYGroupList {
  @Expose({name: 'diys'})
  @Type(() => DIYGroup)
  public diyGroups!: DIYGroup[];
}

export class DIYListResponse
  extends BaseResponse {
  @Expose({name: 'data'})
  @Type(() => AppDeviceResponse)
  public data!: AppDeviceResponse[];
}
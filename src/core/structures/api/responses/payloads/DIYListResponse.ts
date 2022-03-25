import {BaseResponse} from './BaseResponse';
import {Expose, Type} from 'class-transformer';

export class DIYEffect {
  @Expose({name: 'effectId'})
  public effectId!: string;

  @Expose({name: 'effectCode'})
  public effectCodes!: number[];

  @Expose({name: 'effectStr'})
  public effectCommandString!: string;

  @Expose({name: 'diyName'})
  public diyName!: string;

  @Expose({name: 'coverUrl'})
  public coverUrl!: string;

  @Expose({name: 'diyCode'})
  public diyCode!: number;

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
  public diys!: DIYEffect[];
}

export class DIYGroupList {
  @Expose({name: 'diys'})
  @Type(() => DIYGroup)
  public diys!: DIYGroup[];
}

export class DIYListResponse
  extends BaseResponse {
  @Expose({name: 'data'})
  @Type(() => DIYGroupList)
  public data!: DIYGroupList;
}
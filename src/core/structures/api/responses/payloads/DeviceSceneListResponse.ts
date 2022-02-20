import {Expose, Type} from 'class-transformer';
import {BaseResponse} from './BaseResponse';

export class CategoryScene {
  public deviceId!: string;

  @Expose({name: 'sceneId'})
  public id!: number;

  @Expose({name: 'sceneName'})
  public name!: string;

  @Expose({name: 'scenesHint'})
  public description!: string;

  @Expose({name: 'iconUrls'})
  public iconUrls!: string[];
}

export class DeviceSceneCategory {
  @Expose({name: 'categoryId'})
  public id!: number;

  @Expose({name: 'categoryName'})
  public name!: number;

  @Expose({name: 'scenes'})
  @Type(() => CategoryScene)
  public scenes!: CategoryScene[];
}

export class DeviceSceneListResponse extends BaseResponse {
  @Expose({name: 'categories'})
  @Type(() => DeviceSceneCategory)
  public categories!: DeviceSceneCategory[];
}
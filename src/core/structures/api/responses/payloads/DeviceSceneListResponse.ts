import {Expose, Type} from 'class-transformer';
import {BaseResponse} from './BaseResponse';

export class SceneLightEffect {
  @Expose({name: 'scenceParamId'})
  public scenceParamId!: number;

  @Expose({name: 'scenceName'})
  public scenceName!: string;

  @Expose({name: 'scenceCode'})
  public scenceCode!: number;
}

export class CategoryScene {
  public deviceId!: string;

  @Expose({name: 'sceneId'})
  public sceneId!: number;

  @Expose({name: 'sceneCode'})
  public sceneCode!: number;

  @Expose({name: 'sceneName'})
  public sceneName!: string;

  @Expose({name: 'scenesHint'})
  public scenesHint!: string;

  @Expose({name: 'iconUrls'})
  public iconUrls!: string[];

  @Expose({name: 'lightEffects'})
  @Type(() => SceneLightEffect)
  public lightEffects!: SceneLightEffect[];
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

export class DeviceSceneListData {
  @Expose({name: 'categories'})
  @Type(() => DeviceSceneCategory)
  public categories!: DeviceSceneCategory[];
}

export class DeviceSceneListResponse extends BaseResponse {
  @Expose({name: 'data'})
  @Type(() => DeviceSceneListData)
  public data!: DeviceSceneListData;
}
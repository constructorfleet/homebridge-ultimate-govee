import {Expose, Type} from 'class-transformer';

export class CategoryScene {
  @Expose({name: 'sceneId'})
  public id!: number;

  @Expose({name: 'sceneName'})
  public name!: number;

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

export class DeviceSceneResponse {
  @Expose({name: 'categories'})
  @Type(() => DeviceSceneCategory)
  public categories!: DeviceSceneCategory[];
}
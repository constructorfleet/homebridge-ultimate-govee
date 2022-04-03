import {BaseFeatureHandler} from './features/BaseFeatureHandler';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {ModuleRef} from '@nestjs/core';

export class Features {
  // @ts-ignore
  private static readonly handlerConstructors: Constructor<BaseFeatureHandler>[] = [];

  static getHandlers(): Provider {
    return {
      provide: Features,
      useFactory: async (moduleRef: ModuleRef): Promise<() => Promise<BaseFeatureHandler[]>> =>
        async (): Promise<BaseFeatureHandler[]> => {
          console.log('Getting handlers');
          return await Promise.all(
            Features.handlerConstructors.map(
              (ctor: Constructor<BaseFeatureHandler>) => moduleRef.create(ctor),
            ),
          );
        },
      inject: [ModuleRef],
    };
  }

  static add<T extends Constructor<BaseFeatureHandler>>(ctor: T) {
    Features.handlerConstructors.push(ctor);

    return ctor;
  }
}
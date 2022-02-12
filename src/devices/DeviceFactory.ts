import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';
import {GoveeDevice} from './GoveeDevice';

export class DeviceFactory {
  private static readonly providers: Provider[] = [];

  static getProviders(): Provider[] {
    console.log(DeviceFactory.providers);
    return DeviceFactory.providers;
  }

  static register<T extends Constructor<GoveeDevice>>(
    ...models: string[]
  ): (ctor: T) => void {
    return (ctor: T) => {
      DeviceFactory.providers.push(
        ...models.map(
          (model) => {
            return {
              provide: model,
              useValue: function() {
                return (config) => new ctor(config);
              },
            };
          },
        ),
      );

      return ctor;
    };
  }
}
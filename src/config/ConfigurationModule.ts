import {GoveeDefaultConfiguration, GoveeGraphQLConfiguration} from '../platform';
import {DynamicModule} from '@nestjs/common';
import {GOVEE_CONFIGURATION} from '../util';
import {ConfigService} from '@nestjs/config';

export class ConfigurationModule {
  public static register(
      config: GoveeDefaultConfiguration | GoveeGraphQLConfiguration,
  ): DynamicModule {
    if (!Object.keys(config).includes('graphQLListenPort')) {
      return {
        module: ConfigurationModule,
        providers: [
          {
            provide: GOVEE_CONFIGURATION,
            useValue: config,
          },
        ],
        exports: [],
      };
    } else {
      return {
        module: ConfigurationModule,
        providers: [
          {
            provide: GOVEE_CONFIGURATION,
            useValue: config,
          },
          ConfigService,
        ],
        exports: [
          ConfigService,
        ],
      };
    }
  }
}

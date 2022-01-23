import {DynamicModule, Module} from '@nestjs/common';
import {GOVEE_API_KEY, GOVEE_CONFIGURATION, GOVEE_PASSWORD, GOVEE_USERNAME} from '../util/const';
import {GoveeConfiguration} from './GoveeConfiguration';
import {ConfigurationService} from './ConfigurationService';

@Module({})
export class ConfigurationModule {
  public static register(config: GoveeConfiguration): DynamicModule {
    return {
      module: ConfigurationModule,
      providers: [
        {
          provide: GOVEE_CONFIGURATION,
          useValue: config,
        },
        ConfigurationService,
      ],
      exports: [
        ConfigurationService,
      ],
    };
  }
}
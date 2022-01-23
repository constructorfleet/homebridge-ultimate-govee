import {DynamicModule, Module} from '@nestjs/common';
import {GOVEE_API_KEY, GOVEE_CONFIGURATION, GOVEE_PASSWORD, GOVEE_USERNAME, PERSIST_CONFIGURATION, STORAGE_PATH} from '../util/const';
import {PersistConfiguration} from './PersistConfiguration';
import {PersistService} from './PersistService';

@Module({})
export class PersistModule {
  public static register(config: PersistConfiguration): DynamicModule {
    return {
      module: PersistModule,
      providers: [
        {
          provide: PERSIST_CONFIGURATION,
          useValue: config,
        },
        PersistService,
      ],
      exports: [
        PersistService,
      ],
    };
  }
}
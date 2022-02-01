import {DynamicModule, Module} from '@nestjs/common';
import {LOGGER} from '../util/const';
import {Logger} from './Logger';
import {LoggingService} from './LoggingService';

@Module({})
export class LoggingModule {
  public static register(logger: Logger): DynamicModule {
    return {
      global: true,
      module: LoggingModule,
      providers: [
        {
          provide: LOGGER,
          useValue: logger,
        },
        LoggingService,
      ],
      exports: [
        LoggingService,
      ],
    };
  }
}
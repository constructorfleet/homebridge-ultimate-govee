import { FactoryProvider } from '@nestjs/common';
import {
  LoggerKey,
  LoggerLevels,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from './logger.const';

export const LoggerLevelsProvider: FactoryProvider = {
  provide: LoggerLevels,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: typeof OPTIONS_TYPE) => options?.disabledLevels ?? [],
};

export const LoggerProvider: FactoryProvider = {
  provide: LoggerKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: typeof OPTIONS_TYPE) => options.logger,
};

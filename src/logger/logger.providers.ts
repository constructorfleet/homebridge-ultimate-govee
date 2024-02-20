import { FactoryProvider, Logger } from '@nestjs/common';
import {
  LoggerKey,
  LoggerLevels,
  LoggerModuleOptionsKey,
} from './logger.const';
import { LoggerModuleOptions } from './logger.types';

export const LoggerLevelsProvider: FactoryProvider = {
  provide: LoggerLevels,
  inject: [LoggerModuleOptionsKey],
  useFactory: (options: LoggerModuleOptions) => options?.disabledLevels ?? [],
};

export const LoggerProvider: FactoryProvider = {
  provide: LoggerKey,
  useFactory: () => Logger,
};

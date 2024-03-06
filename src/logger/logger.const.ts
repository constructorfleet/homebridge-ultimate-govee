import { ConfigurableModuleBuilder, Inject } from '@nestjs/common';
import { LoggerModuleOptions } from './logger.types';

export const LoggerKey = 'Logger' as const;
export const InjectLogger = Inject(LoggerKey);
export const LoggerLevels = 'Logger.Levels' as const;
export const InjectDisabledLevels = Inject(LoggerLevels);
export const LoggerModuleOptionsKey = 'Logger.Module.Options' as const;
export const InjectLoggerOptions = Inject(LoggerModuleOptionsKey);

export const {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
  MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<LoggerModuleOptions>({
  moduleName: 'LoggerModule',
  optionsInjectionToken: LoggerModuleOptionsKey,
})
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .setClassMethodName('forRoot')
  .build();

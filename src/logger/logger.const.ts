import { Inject } from '@nestjs/common';

export const LoggerKey = 'Logger' as const;
export const InjectLogger = Inject(LoggerKey);
export const LoggerLevels = 'Logger.Levels' as const;
export const InjectLogLevels = Inject(LoggerLevels);
export const LoggerModuleOptionsKey = 'Logger.Module.Options' as const;
export const InjectLoggerOptions = Inject(LoggerModuleOptionsKey);

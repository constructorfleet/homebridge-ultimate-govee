import { Inject, Injectable } from '@nestjs/common';
import { Logger } from './logger.types';
import { InjectLogLevels, LoggerKey } from './logger.const';

@Injectable()
export class LoggingService {
  constructor(
    @Inject(LoggerKey) private readonly logger: Logger,
    @InjectLogLevels private readonly logLevels: string[],
  ) {}

  info(message: unknown, ...parameters: unknown[]): void {
    if (this.logLevels.includes('info')) {
      return;
    }
    this.logger.info(message, ...parameters);
  }

  warn(message: unknown, ...parameters: unknown[]): void {
    if (this.logLevels.includes('warn')) {
      return;
    }
    this.logger.warn(message, ...parameters);
  }

  error(message: unknown, ...parameters: unknown[]): void {
    if (this.logLevels.includes('error')) {
      return;
    }
    this.logger.error(message, ...parameters);
  }

  debug(message: unknown, ...parameters: unknown[]): void {
    if (this.logLevels.includes('debug')) {
      return;
    }
    this.logger.debug(message, ...parameters);
  }
}

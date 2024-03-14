import { Inject, Injectable } from '@nestjs/common';
import { Logger } from './logger.types';
import { InjectDisabledLevels, LoggerKey } from './logger.const';

@Injectable()
export class LoggingService {
  constructor(
    @Inject(LoggerKey) private readonly logger: Logger,
    @InjectDisabledLevels private readonly disabledLevels: string[],
  ) {}

  info(message: unknown, ...parameters: unknown[]): void {
    if (this.disabledLevels.includes('info')) {
      return;
    }
    this.logger.info(message, ...parameters);
  }

  warn(message: unknown, ...parameters: unknown[]): void {
    if (this.disabledLevels.includes('warn')) {
      return;
    }
    this.logger.warn(message, ...parameters);
  }

  error(message: unknown, ...parameters: unknown[]): void {
    if (this.disabledLevels.includes('error')) {
      return;
    }
    this.logger.error(message, ...parameters);
  }

  debug(message: unknown, ...parameters: unknown[]): void {
    if (this.disabledLevels.includes('debug')) {
      return;
    }
    this.logger.debug(message, ...parameters);
  }
}

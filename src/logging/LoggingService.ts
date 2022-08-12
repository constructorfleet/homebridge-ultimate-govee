import {Inject, Injectable} from '@nestjs/common';
import {LOGGER} from '../util/const';
import {Logger} from './Logger';

@Injectable()
export class LoggingService {
  constructor(
    @Inject(LOGGER) private readonly logger: Logger,
  ) {
  }

  info(message: unknown, ...parameters: unknown[]): void {
    this.logger.info(message, ...parameters);
  }

  warn(message: unknown, ...parameters: unknown[]): void {
    this.logger.warn(message, ...parameters);
  }

  error(message: unknown, ...parameters: unknown[]): void {
    this.logger.error(message, ...parameters);
  }

  debug(message: unknown, ...parameters: unknown[]): void {
    this.logger.debug(message, ...parameters);
  }
}

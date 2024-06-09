import { ConsoleLogger, LogLevel } from '@nestjs/common';
import {
  Logger as HomebridgeLogger,
  LogLevel as HomebridgeLogLevel,
} from 'homebridge';

export class PlatformLogger extends ConsoleLogger {
  private static logger: HomebridgeLogger;
  public static create(homebridgeLogger: HomebridgeLogger): PlatformLogger {
    PlatformLogger.logger = homebridgeLogger;
    return new PlatformLogger('');
  }
  constructor(context: string) {
    super(context);
  }

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
  ) {
    messages.forEach((message) => {
      const pidMessage = this.formatPid(process.pid);
      const contextMessage = this.formatContext(context);
      const timestampDiff = this.updateAndGetTimestampDiff();
      const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');
      const formattedMessage = this.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestampDiff,
      );
      let hbLogLevel: HomebridgeLogLevel;
      switch (logLevel) {
        case 'log':
          hbLogLevel = HomebridgeLogLevel.INFO;
          break;
        case 'debug':
          hbLogLevel = HomebridgeLogLevel.DEBUG;
          break;
        case 'error':
          hbLogLevel = HomebridgeLogLevel.ERROR;
          break;
        case 'fatal':
          hbLogLevel = HomebridgeLogLevel.ERROR;
          break;
        case 'verbose':
          hbLogLevel = HomebridgeLogLevel.DEBUG;
          break;
        case 'warn':
          hbLogLevel = HomebridgeLogLevel.WARN;
          break;
      }
      PlatformLogger.logger.log(hbLogLevel, formattedMessage.trim());
    });
  }
}

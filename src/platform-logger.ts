import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { Logger as HomebridgeLogger } from 'homebridge';

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
      PlatformLogger.logger[logLevel](formattedMessage);
    });
  }
}

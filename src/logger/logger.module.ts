import { Module } from '@nestjs/common';
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from './logger.const';
import { LoggerLevelsProvider, LoggerProvider } from './logger.providers';
import { LoggingService } from './logger.service';

@Module({
  providers: [LoggerLevelsProvider, LoggerProvider, LoggingService],
  exports: [LoggerProvider, LoggingService, MODULE_OPTIONS_TOKEN],
})
export class LoggerModule extends ConfigurableModuleClass {}

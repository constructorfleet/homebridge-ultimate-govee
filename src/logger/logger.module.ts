import { Module } from '@nestjs/common';
import { LoggerModuleOptions } from './logger.types';
import { LoggerModuleOptionsKey } from './logger.const';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { LoggerLevelsProvider, LoggerProvider } from './logger.providers';
import { LoggingService } from './logger.service';

@Module({
  providers: [LoggerLevelsProvider, LoggerProvider, LoggingService],
  exports: [LoggerProvider, LoggingService],
})
export class LoggerModule extends createConfigurableDynamicRootModule<
  LoggerModule,
  LoggerModuleOptions
>(LoggerModuleOptionsKey) {
  static deferred = () => LoggerModule.externallyConfigured(LoggerModule, 0);
}

import { Module } from '@nestjs/common';
import { LoggerModuleOptions } from './logger.types';
import { LoggerModuleOptionsKey } from './logger.const';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { LoggerLevelsProvider, LoggerProvider } from './logger.providers';

@Module({
  providers: [LoggerLevelsProvider, LoggerProvider],
  exports: [LoggerProvider],
})
export class LoggerModule extends createConfigurableDynamicRootModule<
  LoggerModule,
  LoggerModuleOptions
>(LoggerModuleOptionsKey) {
  static deferred = () => LoggerModule.externallyConfigured(LoggerModule, 0);
}

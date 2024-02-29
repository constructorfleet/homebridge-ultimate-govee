import { DynamicModule, Module } from '@nestjs/common';
import { ConfigurableModuleClass, OPTIONS_TYPE } from './accessory.const';
import { AccessoryMapProvider } from './accessory.providers';
import { ServicesModule } from './services/services.module';
import { AccessoryManager } from './accessory.manager';
import { CoreModule } from '../../core';
import { LoggerModule } from '../../logger';
import { HandlerModule } from './handlers/handler.module';

@Module({
  imports: [ServicesModule, HandlerModule, LoggerModule.deferred()],
  providers: [AccessoryMapProvider, AccessoryManager],
  exports: [CoreModule, AccessoryMapProvider, AccessoryManager],
})
export class AccessoryModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const base = super.forRoot(options);
    return {
      ...base,
      imports: [...(base.imports ?? []), options.core, options.pluginConfig],
    };
  }
}

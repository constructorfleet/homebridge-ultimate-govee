import { DynamicModule, Module } from '@nestjs/common';
import { ConfigurableModuleClass, OPTIONS_TYPE } from './accessory.const';
import { AccessoryMapProvider } from './accessory.providers';
import { AccessoryManager } from './accessory.manager';
import { CoreModule } from '../../core';
import { HandlerModule } from './handlers/handler.module';

@Module({
  imports: [HandlerModule],
  providers: [AccessoryMapProvider, AccessoryManager],
  exports: [CoreModule, AccessoryMapProvider, AccessoryManager],
})
export class AccessoryModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const base = super.forRoot(options);
    return {
      ...base,
      imports: [
        ...(base.imports ?? []),
        options.core,
        options.pluginConfig,
        options.logger,
      ],
    };
  }
}

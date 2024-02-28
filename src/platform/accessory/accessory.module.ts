import { DynamicModule, Module } from '@nestjs/common';
import { ConfigurableModuleClass, OPTIONS_TYPE } from './accessory.const';
import { AccessoryMapProvider } from './accessory.providers';
import { ServicesModule } from './services/services.module';
import { AccessoryManager } from './accessory.manager';
import { CoreModule } from '../../core';
import { LoggerModule } from '../../logger';

@Module({
  imports: [ServicesModule, LoggerModule.deferred()],
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

import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './accessory.const';
import { AccessoryMapProvider } from './accessory.providers';
import { CoreModule } from '../../core';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [CoreModule.deferred(), ServicesModule],
  providers: [AccessoryMapProvider],
  exports: [AccessoryMapProvider],
})
export class AccessoryModule extends ConfigurableModuleClass {}

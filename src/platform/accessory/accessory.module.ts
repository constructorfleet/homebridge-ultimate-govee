import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './accessory.const';
import { AccessoryMapProvider } from './accessory.providers';

@Module({
  providers: [AccessoryMapProvider],
  exports: [AccessoryMapProvider],
})
export class AccessoryModule extends ConfigurableModuleClass {}

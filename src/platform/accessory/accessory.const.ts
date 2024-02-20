import { ConfigurableModuleBuilder } from '@nestjs/common';
import { AccessoryModuleOptions } from './accessory.types';

export const AccessoryMapKey = 'Accessory.Map';

export const AccessoryModuleOptionsKey = 'Module.Options.Accessory';

export const {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
  MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<AccessoryModuleOptions>({
  moduleName: 'AccessoryModule',
  optionsInjectionToken: AccessoryModuleOptionsKey,
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();

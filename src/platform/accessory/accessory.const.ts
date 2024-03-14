import { ConfigurableModuleBuilder, Inject } from '@nestjs/common';
import { AccessoryModuleOptions } from './accessory.types';

export const AccessoryMapKey = 'Accessory.Map';

export const AccessoryModuleOptionsKey = 'Module.Options.Accessory';

export const HomebridgeServicesKey = 'Accessory.Homebridge.Services' as const;
export const InjectServices = Inject(HomebridgeServicesKey);
export const HomebridgeCharacteristicsKey =
  'Accessory.Homebridge.Characteristics' as const;
export const InjectCharacteristics = Inject(HomebridgeCharacteristicsKey);
export const HomebridgeApiKey = 'Accessory.Homebridge.Api' as const;
export const InjectHomebridgeApi = Inject(HomebridgeApiKey);
export const GenerateUUIDKey = 'Accessory.Homebridge.UUID' as const;
export const InjectUUID = Inject(GenerateUUIDKey);

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

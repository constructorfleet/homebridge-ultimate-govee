import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { PlatformModuleOptions } from './platform.types';
import {
  UltimateGoveeModule,
  UltimateGoveeModuleOptions,
} from '@constructorfleet/ultimate-govee';
import { AccessoryModule } from './accessory/accessory.module';
import { PlatformService } from './platform.service';
import { AccessoryModuleOptionsType } from './accessory';

export const {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
  MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<PlatformModuleOptions>({
  moduleName: 'PlatformModule',
  optionsInjectionToken: 'Platform.Module.Options',
})
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .setClassMethodName('forRoot')
  .build();

@Module({
  imports: [
    AccessoryModule.forRootAsync({
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: (
        options: typeof OPTIONS_TYPE,
      ): typeof AccessoryModuleOptionsType => ({
        api: options.api,
        logger: options.log,
        disabledLevels: [],
        generateUUID: options.generateUUID,
        config: options.config,
        configPath: options.configPath,
        storagePath: options.storagePath,
      }),
    }),
    UltimateGoveeModule.forRootAsync({
      provideInjectionTokensFrom: [AccessoryModule],
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: (
        options: typeof OPTIONS_TYPE,
      ): typeof UltimateGoveeModuleOptions => ({
        auth: {},
        persist: {
          rootDirectory: options.storagePath,
        },
        channels: {
          ble: {
            enabled: false,
          },
          iot: {
            enabled: false,
          },
        },
      }),
    }),
  ],
  providers: [PlatformService],
  exports: [AccessoryModule, PlatformService, MODULE_OPTIONS_TOKEN],
})
export class PlatformModule extends ConfigurableModuleClass {}

import { Module } from '@nestjs/common';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from './accessory.const';
import {
  AccessoryMapProvider,
  HomebridgeApiProvider,
  HomebridgeCharacteristicProvider,
  HomebridgeServiceProvider,
  HomebridgeUUIDProvider,
} from './accessory.providers';
import { AccessoryManager } from './accessory.manager';
import {
  HandlerRegistry,
  ServiceHandlers,
  SubServiceFactories,
} from './handlers';
import {
  PluginConfigModule,
  PluginConfigModuleOptionsType,
} from '../../config';
import { LoggerModule, LoggerModuleOptionsType } from '../../logger';
import {
  UltimateGoveeModule,
  UltimateGoveeModuleOptions,
} from '@constructorfleet/ultimate-govee';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: (
        options: typeof OPTIONS_TYPE,
      ): typeof LoggerModuleOptionsType => ({
        logger: options.logger,
        disabledLevels: options.disabledLevels,
      }),
    }),
    PluginConfigModule.forRootAsync({
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: (
        options: typeof OPTIONS_TYPE,
      ): typeof PluginConfigModuleOptionsType => ({
        config: options.config,
        path: options.configPath,
      }),
    }),
    UltimateGoveeModule.forRootAsync({
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: (
        options: typeof OPTIONS_TYPE,
      ): typeof UltimateGoveeModuleOptions => {
        return {
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
        };
      },
    }),
  ],
  providers: [
    ...ServiceHandlers,
    ...SubServiceFactories,
    HandlerRegistry,
    AccessoryMapProvider,
    AccessoryManager,
    HomebridgeApiProvider,
    HomebridgeServiceProvider,
    HomebridgeCharacteristicProvider,
    HomebridgeUUIDProvider,
  ],
  exports: [
    LoggerModule,
    PluginConfigModule,
    AccessoryMapProvider,
    HomebridgeApiProvider,
    AccessoryManager,
    MODULE_OPTIONS_TOKEN,
  ],
})
export class AccessoryModule extends ConfigurableModuleClass {}

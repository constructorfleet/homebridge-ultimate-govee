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
  GoveePluginConfig,
  GoveePluginConfiguration,
  PluginConfigModule,
  PluginConfigModuleOptionsType,
} from '../../config';
import { LoggerModule, LoggerModuleOptionsType } from '../../logger';
import {
  PartialBehaviorSubject,
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
      provideInjectionTokensFrom: [PluginConfigModule],
      inject: [MODULE_OPTIONS_TOKEN, GoveePluginConfiguration.provide],
      useFactory: async (
        options: typeof OPTIONS_TYPE,
        config: PartialBehaviorSubject<GoveePluginConfig>,
      ): Promise<typeof UltimateGoveeModuleOptions> => {
        return await new Promise<typeof UltimateGoveeModuleOptions>(
          (resolve) => {
            config.subscribe((config) => {
              if (config !== undefined) {
                resolve({
                  auth: {},
                  persist: {
                    rootDirectory: options.storagePath,
                  },
                  channels: {
                    ble: {
                      enabled: config.controlChannels.ble.getValue(),
                    },
                    iot: {
                      enabled: config.controlChannels.iot.getValue(),
                    },
                  },
                });
              }
            });
          },
        );
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

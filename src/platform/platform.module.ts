import { DynamicModule, Module } from '@nestjs/common';
import { PlatformState } from './platform.state';
import { PluginConfigModule } from '../config/plugin-config.module';
import { CoreModule } from '../core';
import { PlatformModuleOptions } from './platform.types';
import { UltimateGoveeModule } from '@constructorfleet/ultimate-govee';
import { GoveePluginConfig } from '../config/v2/plugin-config.govee';
import { GoveePluginConfiguration } from '../config/plugin-config.providers';
import { AccessoryModule } from './accessory/accessory.module';
import { PartialBehaviorSubject } from '../common';
import { PlatformService } from './platform.service';

@Module({})
export class PlatformModule {
  public static register(options: PlatformModuleOptions): DynamicModule {
    const configModule = PluginConfigModule.forRoot(PluginConfigModule, {
      config: options.config,
      path: options.configPath,
    });
    const coreModule = CoreModule.forRoot(CoreModule, options);
    return {
      module: PlatformModule,
      imports: [
        coreModule,
        configModule,
        AccessoryModule.forRoot({
          core: coreModule,
          pluginConfig: configModule,
          accessories: [],
        }),
        UltimateGoveeModule.forRoot({
          persist: {
            rootDirectory: options.storagePath,
          },
          channels: {
            ble: {
              imports: [configModule],
              inject: [GoveePluginConfiguration.provide],
              useFactory: (
                config: PartialBehaviorSubject<GoveePluginConfig>,
              ) => {
                return {
                  enabled: config.getValue().controlChannels.ble,
                };
              },
            },
            iot: {
              imports: [configModule],
              inject: [GoveePluginConfiguration.provide],
              useFactory: (
                config: PartialBehaviorSubject<GoveePluginConfig>,
              ) => {
                return {
                  enabled: config.getValue().controlChannels.iot,
                };
              },
            },
          },
        }),
      ],
      providers: [PlatformService, PlatformState],
      exports: [PlatformService, PlatformState],
    };
  }
}

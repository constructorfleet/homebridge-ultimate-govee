import { DynamicModule, Module } from '@nestjs/common';
import { PlatformState } from './platform.state';
import { PluginConfigModule } from '../config/plugin-config.module';
import { CoreModule } from '../core';
import { PlatformModuleOptions } from './platform.types';
import { UltimateGoveeModule } from '@constructorfleet/ultimate-govee';

@Module({})
export class PlatformModule {
  public static register(options: PlatformModuleOptions): DynamicModule {
    return {
      module: PlatformModule,
      imports: [
        CoreModule.forRoot(CoreModule, options),
        PluginConfigModule.forRoot(PluginConfigModule, {
          config: options.config,
          path: options.configPath,
        }),
        UltimateGoveeModule.forRoot({
          persist: {
            rootDirectory: options.storagePath,
          },
          channels: {
            ble: {
              imports: [PluginConfigModule.deferred()],
            },
          },
        }),
      ],
      providers: [PlatformState],
      exports: [],
    };
  }
}

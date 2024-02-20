import {
  API,
  Characteristic,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';
import { DynamicModule, Module } from '@nestjs/common';
import { BinaryLike } from 'hap-nodejs/dist/lib/util/uuid';
import { PlatformName, PluginIdentifier } from 'homebridge/lib/api';
import { PlatformState } from './platform.state';
import { PluginConfigModule } from './config/plugin-config.module';
import { CoreModule } from '../core';

export interface GoveeCredentials {
  username: string;
  password: string;
}

export interface GoveeConnections {
  enableIoT: boolean;
  enableBLE: boolean;
  enableAPI: boolean;
}

export interface PlatformModuleOptions {
  api: API;
  service: typeof Service;
  characteristic: typeof Characteristic;
  config: PlatformConfig;
  configPath: string;
  registerAccessory: (
    pluginIdentifier: PluginIdentifier,
    platformName: PlatformName,
    accessories: PlatformAccessory[],
  ) => void;
  updateAccessory: (accessories: PlatformAccessory[]) => void;
  generateUUID: (data: BinaryLike) => string;
}

@Module({})
export class PlatformModule {
  public static register(options: PlatformModuleOptions): DynamicModule {
    return {
      module: PlatformModule,
      imports: [
        CoreModule.forRoot(CoreModule, options),
        PluginConfigModule.forRoot({
          config: options.config,
          path: options.configPath,
        }),
      ],
      providers: [PlatformState],
      exports: [],
    };
  }
}

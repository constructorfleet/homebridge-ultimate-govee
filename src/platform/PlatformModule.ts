import {API, Characteristic, Logger, PlatformAccessory, Service} from 'homebridge';
import {DynamicModule, Module} from '@nestjs/common';
import {GoveePluginModule} from '../core/GoveePluginModule';
import {
  HOMEBRIDGE_API,
  PLATFORM_CHARACTERISTICS,
  PLATFORM_CONFIG, PLATFORM_CONFIG_FILE,
  PLATFORM_SERVICES,
  PLATFORM_UUID_GENERATOR,
} from '../util/const';
import {AccessoryManager} from './accessories/AccessoryManager';
import {BinaryLike} from 'hap-nodejs/dist/lib/util/uuid';
import {InformationService} from './accessories/services/InformationService';
import {HumidifierService} from './accessories/services/HumidifierService';
import {PurifierService} from './accessories/services/PurifierService';
import {PlatformName, PluginIdentifier} from 'homebridge/lib/api';
import {PlatformService} from './PlatformService';
import {PlatformConfigService} from './config/PlatformConfigService';

export interface GoveeCredentials {
  username: string;
  password: string;
  apiKey?: string;
}


export interface PlatformModuleConfig {
  api: API;
  Service: typeof Service;
  Characteristic: typeof Characteristic;
  logger: Logger;
  storagePath: string;
  configPath: string;
  generateUUID: (data: BinaryLike) => string;
  accessoryFactory: typeof PlatformAccessory;
  registerAccessory: (pluginIdentifier: PluginIdentifier, platformName: PlatformName, accessories: PlatformAccessory[]) => void;
  updateAccessory: (accessories: PlatformAccessory[]) => void;
  credentials: GoveeCredentials;
}

@Module({})
export class PlatformModule {
  public static register(config: PlatformModuleConfig): DynamicModule {
    return {
      module: PlatformModule,
      imports: [
        GoveePluginModule.register({
          username: config.credentials.username,
          password: config.credentials.password,
        },
        {
          storagePath: config.storagePath,
        },
        config.logger,
        ),
      ],
      providers: [
        {
          provide: HOMEBRIDGE_API,
          useValue: config.api,
        },
        {
          provide: PLATFORM_UUID_GENERATOR,
          useFactory: (config) => {
            return config.generateUUID;
          },
          inject: [PLATFORM_CONFIG],
        },
        {
          provide: PLATFORM_SERVICES,
          useFactory: (config) => {
            return config.Service;
          },
          inject: [PLATFORM_CONFIG],
        },
        {
          provide: PLATFORM_CHARACTERISTICS,
          useFactory: (config) => {
            return config.Characteristic;
          },
          inject: [PLATFORM_CONFIG],
        },
        {
          provide: PLATFORM_CONFIG,
          useValue: config,
        },
        {
          provide: PLATFORM_CONFIG_FILE,
          useValue: config.configPath,
        },
        InformationService,
        HumidifierService,
        PurifierService,
        AccessoryManager,
        PlatformService,
        PlatformConfigService,
      ],
      exports: [
        GoveePluginModule,
        PlatformService,
      ],
    };
  }
}
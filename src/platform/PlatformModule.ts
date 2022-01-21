import {Characteristic, Logger, PlatformAccessory, Service} from 'homebridge';
import {DynamicModule, Module} from '@nestjs/common';
import {GoveePluginModule} from '../core/GoveePluginModule';
import {
  GOVEE_API_KEY,
  GOVEE_PASSWORD,
  GOVEE_USERNAME,
  PLATFORM_ACCESSORY_FACTORY,
  PLATFORM_CHARACTERISTICS,
  PLATFORM_CONFIG,
  PLATFORM_LOGGER,
  PLATFORM_SERVICES,
  PLATFORM_UUID_GENERATOR,
} from '../util/const';
import {PlatformService} from './PlatformService';
import {AccessoryManager} from './accessories/AccessoryManager';
import {BinaryLike} from 'hap-nodejs/dist/lib/util/uuid';
import {InformationService} from './accessories/services/InformationService';
import {HumidifierService} from './accessories/services/HumidifierService';
import {PurifierService} from './accessories/services/PurifierService';

export interface GoveeCredentials {
  username: string;
  password: string;
  apiKey: string;
}

export interface PlatformModuleConfig {
  Service: typeof Service;
  Characteristic: typeof Characteristic;
  logger: Logger;
  generateUUID: (data: BinaryLike) => string;
  accessoryFactory: typeof PlatformAccessory;
  credentials: GoveeCredentials;
}

@Module({})
export class PlatformModule {
  public static register(config: PlatformModuleConfig): DynamicModule {
    return {
      module: PlatformModule,
      imports: [
        GoveePluginModule,
      ],
      providers: [
        {
          provide: GOVEE_USERNAME,
          useValue: config.credentials.username,
        },
        {
          provide: GOVEE_PASSWORD,
          useValue: config.credentials.password,
        },
        {
          provide: GOVEE_API_KEY,
          useValue: config.credentials.apiKey,
        },
        {
          provide: PLATFORM_CONFIG,
          useValue: config,
        },
        {
          provide: PLATFORM_LOGGER,
          useFactory: (config) => {
            return config.logger;
          },
          inject: [PLATFORM_CONFIG],
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
          provide: PLATFORM_ACCESSORY_FACTORY,
          useFactory: (config) => {
            return config.accessoryFactory;
          },
          inject: [PLATFORM_CONFIG],
        },
        InformationService,
        HumidifierService,
        PurifierService,
        AccessoryManager,
        PlatformService,
      ],
      exports: [
        GoveePluginModule,
        PlatformService,
      ],
    };
  }
}
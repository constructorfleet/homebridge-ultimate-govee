// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  AccessoryManager,
  EffectService,
  HumidifierService,
  InformationService,
  PurifierService,
  RGBLightService,
  SegmentedLightService,
  ServiceRegistry,
  WhiteLightService,
} from './accessories';
import {API, Characteristic, PlatformAccessory, PlatformName, PluginIdentifier, Service} from 'homebridge';
import {DynamicModule, Module} from '@nestjs/common';
import {BinaryLike} from 'crypto';
import {DeviceSubEffectsFeature} from './config/features/DeviceSubEffects';
import {DisableDIYEffectsFeature} from './config/features/DisableDIYEffectsFeature';
import {GoveePluginModule} from '../core';
import {
  HOMEBRIDGE_API,
  PLATFORM_CHARACTERISTICS,
  PLATFORM_CONFIG,
  PLATFORM_CONFIG_FILE,
  PLATFORM_SERVICES,
  PLATFORM_UUID_GENERATOR,
} from '../util';
import {Features, PlatformConfigService} from './config';
import {PlatformService} from './PlatformService';
import {Logger} from '../logging';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ACCESSORY_SERVICES = [
  InformationService,
  HumidifierService,
  PurifierService,
  WhiteLightService,
  RGBLightService,
  SegmentedLightService,
  EffectService,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FEATURE_FLAG_HANDLERS = [
  DeviceSubEffectsFeature,
  DisableDIYEffectsFeature,
];

interface GoveeCredentials {
  username: string;
  password: string;
}

interface GoveeConnections {
  enableIoT: boolean;
  enableBLE: boolean;
  enableAPI: boolean;
}

export interface PlatformModuleConfig {
  rootPath: string;
  api: API;
  Service: typeof Service;
  Characteristic: typeof Characteristic;
  logger: Logger;
  storagePath: string;
  configPath: string;
  generateUUID: (data: BinaryLike) => string;
  accessoryFactory: typeof PlatformAccessory;
  registerAccessory: (
    pluginIdentifier: PluginIdentifier,
    platformName: PlatformName,
    accessories: PlatformAccessory[],
  ) => void;
  updateAccessory: (accessories: PlatformAccessory[]) => void;
  credentials: GoveeCredentials;
  connections: GoveeConnections;
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
            enableBLE: config.connections.enableBLE,
            enableIoT: config.connections.enableIoT,
            enableAPI: config.connections.enableAPI,
          },
          {
            storagePath: config.storagePath,
          },
          config.rootPath,
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
        ServiceRegistry.getServices(),
        Features.getHandlers(),
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

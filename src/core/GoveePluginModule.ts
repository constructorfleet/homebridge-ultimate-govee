import {DynamicModule, Module} from '@nestjs/common';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {
  DeviceFactory,
  DeviceManager,
  GoveeAirPurifier,
  GoveeHumidifier,
  GoveeLight,
  GoveeRGBICLight,
  GoveeRGBLight
} from '../devices';
import {BLEClient, IoTClient, RestClient} from '../data';
import {GOVEE_CLIENT_ID, IOT_CA_CERTIFICATE, IOT_CERTIFICATE, IOT_HOST, IOT_KEY} from '../util';
import path from 'path';

import {ConfigurationModule} from '../config';
import {PersistConfiguration, PersistModule} from '../persist';
import {Logger, LoggingModule} from '../logging';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {BLEEventProcessor, IoTEventProcessor, RestEventProcessor} from '../interactors';
import {Md5} from 'ts-md5';
import {v4 as uuidv4} from 'uuid';
import {EffectsManager} from '../effects';
import {GoveeDefaultConfiguration} from '../platform';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GOVEE_DEVICE_TYPES = [
  GoveeHumidifier,
  GoveeAirPurifier,
  GoveeLight,
  GoveeRGBLight,
  GoveeRGBICLight,
];

@Module({})
export class GoveePluginModule {
  constructor() {
  }

  public static register(
      config: GoveeDefaultConfiguration,
      persistConfig: PersistConfiguration,
      rootPath: string,
      logger: Logger,
  ): DynamicModule {
    const connectionProviders: Provider[] = [];
    if (config.enableBLE) {
      connectionProviders.push(BLEClient);
      connectionProviders.push(BLEEventProcessor);
    }
    if (config.enableIoT) {
      connectionProviders.push(IoTClient);
      connectionProviders.push(IoTEventProcessor);
    }
    if (config.enableAPI) {
      connectionProviders.push(RestClient);
      connectionProviders.push(RestEventProcessor);
    }
    return {
      module: GoveePluginModule,
      imports: [
        LoggingModule.register(logger),
        EventEmitterModule.forRoot({
          // set this to `true` to use wildcards
          wildcard: true,
          // the delimiter used to segment namespaces
          delimiter: '.',
          // set this to `true` if you want to emit the newListener event
          newListener: true,
          // set this to `true` if you want to emit the removeListener event
          removeListener: true,
          // the maximum amount of listeners that can be assigned to an event
          maxListeners: 10,
          // show event name in memory leak message when more than maximum amount of listeners is assigned
          verboseMemoryLeak: false,
          // disable throwing uncaughtException if an error event is emitted and it has no listeners
          ignoreErrors: false,
        }),
        PersistModule.register(persistConfig),
        ConfigurationModule.register(config),
      ],
      providers: [
        {
          provide: IOT_HOST,
          useValue: 'aqm3wd1qlc3dy-ats.iot.us-east-1.amazonaws.com',
        },
        {
          provide: IOT_KEY,
          useValue: path.resolve(path.join(rootPath, 'assets', 'testiot.cert.pkey')),
        },
        {
          provide: IOT_CERTIFICATE,
          useValue: path.resolve(path.join(rootPath, 'assets', 'testiot.cert.pem')),
        },
        {
          provide: IOT_CA_CERTIFICATE,
          useValue: path.resolve(path.join(rootPath, 'assets', 'AmazonRootCA1.pem')),
        },
        {
          provide: GOVEE_CLIENT_ID,
          useValue: Md5.hashStr(
              Buffer.from(uuidv4() + (new Date().getMilliseconds()).toString()).toString('utf8'),
              false,
          ),
        },
        ...DeviceFactory.getProviders(),
        ...connectionProviders,
        DeviceManager,
        EffectsManager,
      ],
      exports: [
        ...DeviceFactory.getProviders(),
        IOT_CA_CERTIFICATE,
        IOT_CERTIFICATE,
        IOT_KEY,
        IOT_HOST,
        GOVEE_CLIENT_ID,
        LoggingModule,
        ...connectionProviders,
        DeviceManager,
        EffectsManager,
        ConfigurationModule,
        PersistModule,
        LoggingModule,
      ],
    };
  }
}

import {DynamicModule, Module} from '@nestjs/common';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {DeviceManager} from '../devices/DeviceManager';
import {RestClient} from '../data/clients/RestClient';
import {GOVEE_CLIENT_ID, IOT_CA_CERTIFICATE, IOT_CERTIFICATE, IOT_HOST, IOT_KEY} from '../util/const';
import path from 'path';
import {machineIdSync} from 'node-machine-id';
import {humidifierProviders} from '../devices/GoveeHumidifier';
import {purifierProviders} from '../devices/GoveeAirPurifier';
import {IoTPayloadProcessor} from '../interactors/data/IoTPayloadProcessor';
import {RestEventProcessor} from '../interactors/data/RestPayloadProcessor';
import {ConfigurationModule} from '../config/ConfigurationModule';
import {GoveeConfiguration} from '../config/GoveeConfiguration';
import {PersistConfiguration} from '../persist/PersistConfiguration';
import {PersistModule} from '../persist/PersistModule';
import {LoggingModule} from '../logging/LoggingModule';
import {Logger} from '../logging/Logger';
import {BLEClient} from '../data/clients/BLEClient';
import {BLEPayloadProcessor} from '../interactors/data/BLEPayloadProcessor';
import {IoTClient} from '../data/clients/IoTClient';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';


@Module({})
export class GoveePluginModule {
  public static register(
    config: GoveeConfiguration,
    persistConfig: PersistConfiguration,
    rootPath: string,
    logger: Logger,
  ): DynamicModule {
    logger.error(path.join('assets', 'testiot.cert.pkey'));
    const connectionProviders: Provider[] = [];
    if (config.enableBLE) {
      connectionProviders.push(BLEClient);
      connectionProviders.push(BLEPayloadProcessor);
    }
    if (config.enableIoT) {
      connectionProviders.push(IoTClient);
      connectionProviders.push(IoTPayloadProcessor);
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
          useValue: machineIdSync().slice(0, 10),
        },
        ...purifierProviders,
        ...humidifierProviders,
        ...connectionProviders,
        RestEventProcessor,
        RestClient,
        DeviceManager,
      ],
      exports: [
        ...purifierProviders,
        ...humidifierProviders,
        IOT_CA_CERTIFICATE,
        IOT_CERTIFICATE,
        IOT_KEY,
        IOT_HOST,
        GOVEE_CLIENT_ID,
        LoggingModule,
        ...connectionProviders,
        RestEventProcessor,
        RestClient,
        DeviceManager,
        ConfigurationModule,
        PersistModule,
        LoggingModule,
      ],
    };
  }

  constructor() {
  }
}
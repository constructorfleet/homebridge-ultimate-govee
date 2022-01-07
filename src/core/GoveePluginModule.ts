import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {DeviceManager} from '../devices/DeviceManager';
import {IoTClient} from '../data/clients/IoTClient';
import {RestClient} from '../data/clients/RestClient';
import {
  GOVEE_API_KEY,
  GOVEE_CLIENT_ID,
  GOVEE_PASSWORD,
  GOVEE_USERNAME,
  IOT_CA_CERTIFICATE,
  IOT_CERTIFICATE,
  IOT_HOST,
  IOT_KEY,
} from '../util/const';
import path from 'path';
import {machineIdSync} from 'node-machine-id';
import {humidifierProviders} from '../devices/GoveeHumidifier';
import {purifierProviders} from '../devices/GoveeAirPurifier';
import {IoTMessageProcessor} from '../interactors/IoTMessageProcessor';
import {RestPayloadProcessor} from '../interactors/RestPayloadProcessor';

const modules = [
  ConfigModule.forRoot({
    envFilePath: '/Users/tglenn/src/homebridge/homebridge-ultimate-govee/.env',
  }),
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
];

@Module({
  imports: modules,
  providers: [
    ConfigService,
    {
      provide: IOT_HOST,
      useValue: 'aqm3wd1qlc3dy-ats.iot.us-east-1.amazonaws.com',
    },
    {
      provide: IOT_KEY,
      useValue: path.join('assets', 'testiot.cert.pkey'),
    },
    {
      provide: IOT_CERTIFICATE,
      useValue: path.join('assets', 'testiot.cert.pem'),
    },
    {
      provide: IOT_CA_CERTIFICATE,
      useValue: path.join('assets', 'AmazonRootCA1.pem'),
    },
    {
      provide: GOVEE_CLIENT_ID,
      useValue: machineIdSync().slice(0, 10),
    },
    {
      provide: GOVEE_USERNAME,
      useValue: process.env[GOVEE_USERNAME],
    },
    {
      provide: GOVEE_PASSWORD,
      useValue: process.env[GOVEE_PASSWORD],
    },
    {
      provide: GOVEE_API_KEY,
      useValue: process.env[GOVEE_API_KEY],
    },
    ...purifierProviders,
    ...humidifierProviders,
    IoTMessageProcessor,
    IoTClient,
    RestPayloadProcessor,
    RestClient,
    DeviceManager,
  ],
  exports: [
    ...modules,
    ...purifierProviders,
    ...humidifierProviders,
    IoTMessageProcessor,
    ConfigService,
    IoTClient,
    RestPayloadProcessor,
    RestClient,
    DeviceManager,
  ],
})
export class GoveePluginModule {
  constructor() {
  }
}
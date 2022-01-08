import {API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';
import {INestApplicationContext} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {RestAuthenticateEvent} from '../core/events/dataClients/rest/RestAuthentication';
import {GOVEE_CLIENT_ID, GOVEE_PASSWORD, GOVEE_USERNAME} from '../util/const';
import {EventEmitter2} from '@nestjs/event-emitter';
import {GoveeDevice} from '../devices/GoveeDevice';
import {PlatformModule} from './PlatformModule';
import {PlatformService} from './PlatformService';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class UltimateGoveePlatform
  implements DynamicPlatformPlugin {
  private context!: INestApplicationContext;
  private service!: PlatformService;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    // log.info(JSON.stringify(config));
    // process.env[GOVEE_USERNAME]
    // if (!config?.username || !config?.password) {
    //   throw Error('Both Username and Password are required');
    // }
    NestFactory.createApplicationContext(
      PlatformModule.register({
        Service: this.api.hap.Service,
        Characteristic: this.api.hap.Characteristic,
        logger: this.log,
        generateUUID: this.api.hap.uuid.generate,
        accessoryFactory: this.api.platformAccessory,
      }),
      {
        logger: console,
        abortOnError: false,
      },
    ).then((context) => {
      this.context = context;
      this.service = context.get(PlatformService);
      this.service.discoverDevices();
    });

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
  }
}

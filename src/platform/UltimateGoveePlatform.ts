import {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, PlatformIdentifier, PlatformName} from 'homebridge';
import {INestApplicationContext} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {PlatformModule} from './PlatformModule';
import {PlatformService} from './PlatformService';

interface UltimateGoveePlatformConfig {
  platform: PlatformName | PlatformIdentifier;
  name?: string;
  username: string;
  password: string;
  apiKey: string;
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class UltimateGoveePlatform
  implements DynamicPlatformPlugin {
  private context!: INestApplicationContext;
  private service!: PlatformService;
  private loaded = false;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    const goveeConfig = config as UltimateGoveePlatformConfig;
    NestFactory.createApplicationContext(
      PlatformModule.register({
        Service: this.api.hap.Service,
        Characteristic: this.api.hap.Characteristic,
        logger: this.log,
        storagePath: this.api.user.persistPath(),
        generateUUID: this.api.hap.uuid.generate,
        accessoryFactory: this.api.platformAccessory,
        registerAccessory: this.api.registerPlatformAccessories,
        updateAccessory: this.api.updatePlatformAccessories,
        credentials: {
          username: goveeConfig.username,
          password: goveeConfig.password,
          apiKey: goveeConfig.apiKey,
        },
      }),
      {
        logger: console,
        abortOnError: false,
      },
    ).then((context) => {
      this.context = context;
      this.service = context.get(PlatformService);
      if (this.loaded) {
        this.service.discoverDevices();
      }
    });

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      if (this.service) {
        this.service.discoverDevices();
      }
      log.debug('Executed didFinishLaunching callback');
      this.loaded = true;
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
  }
}

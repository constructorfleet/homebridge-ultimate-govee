import {
  API,
  DynamicPlatformPlugin,
  PlatformAccessory,
  PlatformConfig,
  Logger as HomebridgeLogger,
} from 'homebridge';
import { ConsoleLogger, INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PlatformModule } from './platform/platform.module';
import { PlatformService } from './platform/platform.service';
import { plainToInstance } from 'class-transformer';
import { GoveePluginConfig } from './config/v2/plugin-config.govee';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class UltimateGoveePlatform implements DynamicPlatformPlugin {
  private readonly logger: Logger = new Logger(UltimateGoveePlatform.name);
  private appContext!: INestApplicationContext;
  private service!: PlatformService;
  private loaded = false;
  private cachedAccessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: HomebridgeLogger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    const goveeConfig = plainToInstance(GoveePluginConfig, config);
    this.logger.log(goveeConfig.isValid);
    this.logger.log(JSON.stringify(goveeConfig));
    if (!goveeConfig.isValid) {
      log.error('Configuration is missing required properties');
      return;
    }

    NestFactory.createApplicationContext(
      PlatformModule.register({
        api: this.api,
        service: this.api.hap.Service,
        characteristic: this.api.hap.Characteristic,
        config,
        configPath: this.api.user.configPath(),
        storagePath: this.api.user.persistPath(),
        generateUUID: this.api.hap.uuid.generate,
        registerAccessory: this.api.registerPlatformAccessories,
        updateAccessory: this.api.updatePlatformAccessories,
      }),
      {
        logger: new ConsoleLogger(),
        abortOnError: false,
      },
    ).then(async (context) => {
      const logger = new Logger(
        `${UltimateGoveePlatform.name}.createApplicationContext`,
      );
      logger.log('Created');
      this.appContext = context;
      this.service = context.get(PlatformService);
      logger.log('PlatformService', PlatformService);
      while (this.cachedAccessories.length) {
        const acc = this.cachedAccessories.pop();
        if (acc) {
          await this.service.configureAccessory(acc);
        }
      }
      if (this.loaded) {
        await this.service.discoverDevices();
      }
    });

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      new Logger('didFinishLaunching').log('');
      if (this.service) {
        await this.service.discoverDevices();
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
    if (this.service) {
      this.service.configureAccessory(accessory).then();
    } else {
      this.cachedAccessories.push(accessory);
    }
  }
}

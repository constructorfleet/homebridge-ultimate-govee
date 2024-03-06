import {
  API,
  DynamicPlatformPlugin,
  PlatformAccessory,
  PlatformConfig,
  Logger as HomebridgeLogger,
} from 'homebridge';
import { INestApplicationContext, Logger } from '@nestjs/common';
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
      PlatformModule.forRootAsync({
        useFactory: () => ({
          api: this.api,
          service: this.api.hap.Service,
          characteristic: this.api.hap.Characteristic,
          config,
          log,
          configPath: this.api.user.configPath(),
          storagePath: this.api.user.persistPath(),
          generateUUID: this.api.hap.uuid.generate,
          registerAccessory: this.api.registerPlatformAccessories,
          updateAccessory: this.api.updatePlatformAccessories,
        }),
      }),
      {
        logger: ['log', 'warn', 'error'],
        abortOnError: false,
      },
    ).then((appContext) => {
      this.appContext = appContext;
      this.logger.log('Created Nest Context');
      this.service = this.appContext.get(PlatformService);
      this.startGovee();
    });

    this.log.debug('Finished initializing platform:', this.config.platform);
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.loaded = true;
      this.startGovee();
    });
    this.api.on('shutdown', async () => {
      await this.appContext.close();
    });
  }

  private startGovee() {
    if (this.service !== undefined && this.loaded === true) {
      while (this.cachedAccessories.length) {
        const acc = this.cachedAccessories.pop();
        if (acc) {
          this.service.configureAccessory(acc);
        }
      }
      this.service.discoverDevices();
    }
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    if (this.service && this.loaded) {
      (async (accessory: PlatformAccessory) =>
        await this.service.configureAccessory(accessory))(accessory);
    } else {
      this.cachedAccessories.push(accessory);
    }
  }
}

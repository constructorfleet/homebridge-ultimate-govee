import {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig} from 'homebridge';
import {INestApplicationContext} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {PlatformModule} from './PlatformModule';
import {PlatformService} from './PlatformService';
import path from 'path';
import {plainToInstance} from 'class-transformer';
import {GoveePluginConfig} from './config/GoveePluginConfig';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class UltimateGoveePlatform
  implements DynamicPlatformPlugin {
  private appContext!: INestApplicationContext;
  private service!: PlatformService;
  private loaded = false;
  private cachedAccessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    const goveeConfig = plainToInstance(GoveePluginConfig, config);
    if (!goveeConfig.isValid()) {
      log.error('Configuration is missing required properties');
      return;
    }
    NestFactory.createApplicationContext(
      PlatformModule.register({
        rootPath: path.resolve(path.join(__dirname, '..')),
        api: this.api,
        Service: this.api.hap.Service,
        Characteristic: this.api.hap.Characteristic,
        logger: this.log,
        storagePath: this.api.user.persistPath(),
        configPath: this.api.user.configPath(),
        generateUUID: this.api.hap.uuid.generate,
        accessoryFactory: this.api.platformAccessory,
        registerAccessory: this.api.registerPlatformAccessories,
        updateAccessory: this.api.updatePlatformAccessories,
        credentials: {
          username: goveeConfig.username!,
          password: goveeConfig.password!,
        },
        connections: {
          enableIoT: goveeConfig.connections?.iot ?? true,
          enableBLE: goveeConfig.connections?.ble ?? true,
          enableAPI: goveeConfig.connections?.api ?? true,
        },
      }),
      {
        logger: console,
        abortOnError: false,
      },
    ).then(async (context) => {
      this.appContext = context;
      this.service = context.get(PlatformService);
      await this.service.handleFeatureFlags();
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
      this.service.configureAccessory(accessory)
        .then();
    } else {
      this.cachedAccessories.push(accessory);
    }
  }
}

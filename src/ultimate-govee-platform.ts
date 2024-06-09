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
import { GoveePlatformAccessory } from './platform/accessory/govee.accessory';
import { PlatformLogger } from './platform-logger';
import { realpathSync } from 'fs';

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
    this.api.on('didFinishLaunching', async () => {
      log.debug('Executed didFinishLaunching callback');
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
      this.appContext = await NestFactory.createApplicationContext(
        PlatformModule.forRootAsync({
          useFactory: () => ({
            api: this.api,
            config,
            log,
            configPath: realpathSync(this.api.user.configPath()),
            storagePath: realpathSync(this.api.user.persistPath()),
            generateUUID: this.api.hap.uuid.generate,
          }),
        }),
        {
          logger: PlatformLogger.create(log),
          abortOnError: false,
        },
      );
      this.logger.log('Created Nest Context');
      this.service = this.appContext.get(PlatformService);
      this.loaded = true;
      this.startGovee();
    });
    this.api.on('shutdown', async () => {
      if (this.appContext !== undefined) {
        await this.appContext.close();
      }
    });
  }

  private startGovee() {
    if (this.service !== undefined && this.loaded === true) {
      while (this.cachedAccessories.length) {
        const acc = this.cachedAccessories.pop();
        if (acc) {
          this.service.configureAccessory(acc as GoveePlatformAccessory);
        }
      }
      this.service.discoverDevices();
    }
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.cachedAccessories.push(accessory);
  }
}

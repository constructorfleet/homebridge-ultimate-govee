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
  private readonly persistMaxFileSizeBytes?: number;

  constructor(
    public readonly log: HomebridgeLogger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.persistMaxFileSizeBytes = this.resolvePersistMaxFileSize(config);
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
            persistMaxFileSizeBytes: this.persistMaxFileSizeBytes,
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

  private resolvePersistMaxFileSize(config: PlatformConfig): number | undefined {
    const envValue = process.env.GOVEE_PERSIST_MAX_FILE_SIZE_BYTES;
    if (envValue !== undefined) {
      const parsedEnvValue = Number.parseInt(envValue, 10);
      if (Number.isFinite(parsedEnvValue) && parsedEnvValue > 0) {
        return parsedEnvValue;
      }
      this.logger.warn(
        `Ignoring invalid GOVEE_PERSIST_MAX_FILE_SIZE_BYTES value "${envValue}"`,
      );
    }

    const configValue = (config as { persistMaxFileSizeBytes?: unknown })
      .persistMaxFileSizeBytes;
    if (typeof configValue === 'number' && Number.isFinite(configValue)) {
      if (configValue > 0) {
        return configValue;
      }
      this.logger.warn(
        `Ignoring invalid persistMaxFileSizeBytes value "${configValue}"`,
      );
    }
    return undefined;
  }
}

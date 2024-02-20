import { BaseFeatureHandler } from './BaseFeatureHandler';
import { PlatformConfigService } from '../plugin-config.service';
import { Features } from '../v1/Features';
import { LoggingService } from '../../../logger/logger.service';

@Features.add
export class DeviceSubEffectsFeature extends BaseFeatureHandler {
  public constructor(
    configService: PlatformConfigService,
    log: LoggingService,
  ) {
    super('DeviceSubEffects', true, configService, log);
  }

  async onFeatureActivated(): Promise<void> {
    this.log.info('Activating Feature', this.featureFlag);
    return await this.configService.setConfigurationEffects(undefined, []);
  }

  async onFeatureDeactivated(): Promise<void> {
    this.log.info('Deactivating Feature', this.featureFlag);
    return await this.configService.setConfigurationEffects(undefined, []);
  }
}

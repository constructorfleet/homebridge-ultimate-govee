import {BaseFeatureHandler} from './BaseFeatureHandler';
import {PlatformConfigService} from '../PlatformConfigService';
import {Features} from '../Features';
import {LoggingService} from '../../../logging/LoggingService';

@Features.add
export class DeviceSubEffectsFeature extends BaseFeatureHandler {
  public constructor(
    configService: PlatformConfigService,
    log: LoggingService,
  ) {
    super(
      'DeviceSubEffects',
      true,
      configService,
      log,
    );
  }

  async onFeatureActivated(): Promise<void> {
    this.log.info('Activating Feature', this.featureFlag);
    return await this.configService.setConfigurationEffects(
      undefined,
      []);
  }

  async onFeatureDeactivated(): Promise<void> {
    this.log.info('Deactivating Feature', this.featureFlag);
    return await this.configService.setConfigurationEffects(
      undefined,
      []);
  }

}
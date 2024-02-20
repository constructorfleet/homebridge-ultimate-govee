import { BaseFeatureHandler } from './BaseFeatureHandler';
import { PlatformConfigService } from '../plugin-config.service';
import { Features } from '../v1/Features';
import { LoggingService } from '../../../logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Features.add
export class DisableDIYEffectsFeature extends BaseFeatureHandler {
  public constructor(
    configService: PlatformConfigService,
    private readonly eventEmitter: EventEmitter2,
    log: LoggingService,
  ) {
    super('DisableDIYEffects', true, configService, log);
  }

  async onFeatureActivated(): Promise<void> {
    this.log.info('Activating Feature', this.featureFlag);

    const removeAllDIYListeners = () => {
      this.log.debug('Removing listeners for DIY Effects');
      this.eventEmitter
        .removeAllListeners('REST.REQUEST.DIYEffects')
        .removeAllListeners('REST.RESPONSE.DIYEffects');
    };

    this.eventEmitter.prependListener(
      'DEVICE.RECEIVED.Settings',
      removeAllDIYListeners,
    );

    await this.configService.setConfigurationEffects([]);
  }

  async onFeatureDeactivated(): Promise<void> {
    this.log.info('Deactivating Feature', this.featureFlag);
    return await this.configService.setConfigurationEffects([]);
  }
}

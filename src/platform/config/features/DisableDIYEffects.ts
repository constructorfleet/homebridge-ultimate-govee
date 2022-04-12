import {BaseFeatureHandler} from './BaseFeatureHandler';
import {PlatformConfigService} from '../PlatformConfigService';
import {Features} from '../Features';
import {LoggingService} from '../../../logging/LoggingService';
import {EventEmitter2} from '@nestjs/event-emitter';
import {RestRequestDIYEffects} from '../../../core/events/dataClients/rest/RestRequest';

@Features.add
export class DisableDIYEffects extends BaseFeatureHandler {
  public constructor(
    configService: PlatformConfigService,
    private readonly eventEmitter: EventEmitter2,
    log: LoggingService,
  ) {
    super(
      'DisableDIYEffects',
      true,
      configService,
      log,
    );
  }

  async onFeatureActivated(): Promise<void> {
    this.log.info('Activating Feature', this.featureFlag);
    this.eventEmitter.removeAllListeners(
      new RestRequestDIYEffects().eventName,
    );
    await this.configService.setConfigurationEffects(
      [],
    );
  }

  async onFeatureDeactivated(): Promise<void> {
    this.log.info('Deactivating Feature', this.featureFlag);
    return await this.configService.setConfigurationEffects(
      [],
    );
  }
}

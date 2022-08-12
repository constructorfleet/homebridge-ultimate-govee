import {PlatformConfigService} from '../PlatformConfigService';
import {LoggingService} from '../../../logging';

export abstract class BaseFeatureHandler {

  protected constructor(
    protected readonly featureFlag: string,
    protected readonly enabled: boolean,
    protected readonly configService: PlatformConfigService,
    protected readonly log: LoggingService,
  ) {
  }

  public async process() {
    const hasFlag = this.configService.hasFeatureFlag(this.featureFlag);
    // this.log.info('Has Flag', this.featureFlag, hasFlag, 'enabled?', this.enabled);
    if (this.enabled && !hasFlag) {
      await this.configService.addFeatureFlags(this.featureFlag);
      await this.onFeatureActivated();
    }
    if (!this.enabled && hasFlag) {
      await this.configService.removeFeatureFlags(this.featureFlag);
      await this.onFeatureDeactivated();
    }
  }

  protected abstract onFeatureActivated(): Promise<void>;

  protected abstract onFeatureDeactivated(): Promise<void>;
}

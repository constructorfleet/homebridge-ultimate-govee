import { PlatformEvent } from './PlatformEvent';
import { GoveePluginConfig } from '../v1/plugin-config.govee';

export interface PlatformConfigBeforeAfter {
  before: GoveePluginConfig;
  after: GoveePluginConfig;
}

export abstract class PlatformConfigurationEvent<
  EventDataType,
> extends PlatformEvent<EventDataType> {
  protected constructor(eventName: string, eventData?: EventDataType) {
    super(`CONFIG.${eventName}`, eventData);
  }
}

export class PlatformConfigurationReloaded extends PlatformConfigurationEvent<PlatformConfigBeforeAfter> {
  constructor(eventData: PlatformConfigBeforeAfter) {
    super('Reloaded', eventData);
  }
}

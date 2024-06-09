import { DiyEffectConfig } from '../../../config';
import { DiyEffectChangedEvent } from './diy-effect-changed.event';

export class AddDiyEffectEvent extends DiyEffectChangedEvent {
  constructor(
    deviceId: string,
    readonly effectConfig: Required<Omit<DiyEffectConfig, 'description'>>,
  ) {
    super(deviceId, effectConfig.code);
  }
}

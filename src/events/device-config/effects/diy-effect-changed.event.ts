import { BaseEffectChangedEvent } from './base-effect-changed.event';

const effectType = 'diy';

export abstract class DiyEffectChangedEvent extends BaseEffectChangedEvent {
  constructor(deviceId: string, code: number) {
    super(deviceId, effectType, code);
  }
}

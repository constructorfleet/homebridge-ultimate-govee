import { BaseEffectChangedEvent } from './base-effect-changed.event';

const effectType = 'lightEffect';

export abstract class LightEffectChangedEvent extends BaseEffectChangedEvent {
  constructor(deviceId: string, code: number) {
    super(deviceId, effectType, code);
  }
}

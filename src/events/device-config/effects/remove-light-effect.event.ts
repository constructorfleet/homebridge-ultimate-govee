import { LightEffectChangedEvent } from './light-effect-changed.event';

export class RemoveLightEffectEvent extends LightEffectChangedEvent {
  constructor(
    deviceId: string,
    readonly code: number,
  ) {
    super(deviceId, code);
  }
}

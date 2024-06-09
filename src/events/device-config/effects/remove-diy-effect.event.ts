import { DiyEffectChangedEvent } from './diy-effect-changed.event';

export class RemoveDiyEffectEvent extends DiyEffectChangedEvent {
  constructor(
    deviceId: string,
    readonly code: number,
  ) {
    super(deviceId, code);
  }
}

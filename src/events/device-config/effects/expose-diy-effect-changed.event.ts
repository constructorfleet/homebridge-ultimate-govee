import { DiyEffectChangedEvent } from './diy-effect-changed.event';

export class ExposeDiyEffectChangedEvent extends DiyEffectChangedEvent {
  constructor(
    deviceId: string,
    code: number,
    readonly expose: boolean,
  ) {
    super(deviceId, code);
  }
}

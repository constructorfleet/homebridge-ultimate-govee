import { DiyEffectChangedEvent } from './diy-effect-changed.event';

export class NameDiyEffectChangedEvent extends DiyEffectChangedEvent {
  constructor(
    deviceId: string,
    code: number,
    readonly name: string,
  ) {
    super(deviceId, code);
  }
}

import { LightEffectChangedEvent } from './light-effect-changed.event';

export class NameLightEffectChangedEvent extends LightEffectChangedEvent {
  constructor(
    deviceId: string,
    code: number,
    readonly name: string,
  ) {
    super(deviceId, code);
  }
}

import { LightEffectChangedEvent } from './light-effect-changed.event';

export class ExposeLightEffectChangedEvent extends LightEffectChangedEvent {
  constructor(
    deviceId: string,
    code: number,
    readonly expose: boolean,
  ) {
    super(deviceId, code);
  }
}

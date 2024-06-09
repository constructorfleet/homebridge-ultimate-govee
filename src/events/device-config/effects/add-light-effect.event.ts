import { LightEffectConfig } from '../../../config';
import { LightEffectChangedEvent } from './light-effect-changed.event';

export class AddLightEffectEvent extends LightEffectChangedEvent {
  constructor(
    deviceId: string,
    readonly effectConfig: Required<LightEffectConfig>,
  ) {
    super(deviceId, effectConfig.code);
  }
}

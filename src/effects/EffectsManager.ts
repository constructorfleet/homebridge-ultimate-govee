import {Emitter} from '../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../logging/LoggingService';
import {DIYEffect} from '../core/structures/api/responses/payloads/DIYListResponse';
import {DIYLightEffect} from './implementations/DIYLightEffect';
import {DIYEffectDiscovered} from '../core/events/effects/DIYEffects';
import {DeviceLightEffect} from './implementations/DeviceLightEffect';
import {CategoryScene} from '../core/structures/api/responses/payloads/DeviceSceneListResponse';
import {DeviceEffectDiscovered} from '../core/events/effects/DeviceEffects';

export class EffectsManager extends Emitter {
  private readonly diyEffects: Map<number, DIYLightEffect> =
    new Map<number, DIYLightEffect>();

  private readonly deviceEffects: Map<number, DeviceLightEffect> =
    new Map<number, DeviceLightEffect>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'EFFECT.DIY.Received',
  )
  async onDIYEffectReceived(effect: DIYEffect) {
    const lightEffect =
      new DIYLightEffect(
        effect.id,
        effect.name,
      );
    if (this.diyEffects.has(lightEffect.id)) {
      return;
    }

    this.diyEffects.set(lightEffect.id, lightEffect);
    await this.emitAsync(
      new DIYEffectDiscovered(lightEffect),
    );
  }

  @OnEvent(
    'EFFECT.DEVICE.Received',
  )
  async onDeviceEffectReceived(effect: CategoryScene) {
    const lightEffect =
      new DeviceLightEffect(
        effect.id,
        effect.name,
        effect.deviceId,
      );

    if (this.deviceEffects.has(lightEffect.id)) {
      return;
    }

    await this.emitAsync(
      new DeviceEffectDiscovered(lightEffect),
    );
  }
}
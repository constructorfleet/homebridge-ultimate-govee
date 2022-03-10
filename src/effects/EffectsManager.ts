import {Emitter} from '../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../logging/LoggingService';
import {DIYEffect} from '../core/structures/api/responses/payloads/DIYListResponse';
import {DIYLightEffect} from './implementations/DIYLightEffect';
import {DIYEffectDiscovered} from '../core/events/effects/DIYEffects';
import {DeviceLightEffect} from './implementations/DeviceLightEffect';
import {CategoryScene} from '../core/structures/api/responses/payloads/DeviceSceneListResponse';
import {DeviceEffectDiscovered} from '../core/events/effects/DeviceEffects';
import {Injectable} from '@nestjs/common';

@Injectable()
export class EffectsManager extends Emitter {
  private readonly diyEffects: Map<number, DIYLightEffect> =
    new Map<number, DIYLightEffect>();

  private readonly deviceEffects: Map<number, DeviceLightEffect[]> =
    new Map<number, DeviceLightEffect[]>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'EFFECT.DIY.Received',
  )
  async onDIYEffectReceived(effects: DIYEffect[]) {
    const lightEffects =
      effects.map(
        (effect) =>
          new DIYLightEffect(
            effect.diyCode,
            effect.diyName,
          ),
      );

    const newEffects = lightEffects.filter(
      (effect: DIYLightEffect) => !this.diyEffects.has(effect.id),
    ).map(
      (effect: DIYLightEffect) => {
        this.diyEffects.set(effect.id, effect);
        return effect;
      },
    );
    await this.emitAsync(
      new DIYEffectDiscovered(newEffects),
    );
  }

  @OnEvent(
    'EFFECT.DEVICE.Received',
  )
  async onDeviceEffectReceived(effects: CategoryScene[]) {
    const lightEffects =
      effects.map(
        (effect) => new DeviceLightEffect(
          effect.sceneCode,
          effect.sceneName,
          effect.scenesHint,
          effect.deviceId,
        ),
      );

    lightEffects.forEach(
      (lightEffect: DeviceLightEffect) => this.deviceEffects.set(
        lightEffect.id,
        (this.deviceEffects.get(lightEffect.id) || []).concat(lightEffect),
      ),
    );

    await this.emitAsync(
      new DeviceEffectDiscovered(lightEffects),
    );
  }
}
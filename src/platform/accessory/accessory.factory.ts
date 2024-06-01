import { Injectable, Type } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoveeAccessory } from './govee.accessory';
import {
  Device,
  DeviceStatesType,
  DiyEffect,
  DiyModeState,
  DiyModeStateName,
  LightEffect,
  LightEffectState,
  LightEffectStateName,
  PartialBehaviorSubject,
} from '@constructorfleet/ultimate-govee';
import {
  DiyEffectDiscoveredEvent,
  DiyEffectRemovedEvent,
  LightEffectDiscoveredEvent,
  LightEffectRemovedEvent,
} from '../../events';
import { PlatformAccessory } from 'homebridge';
import { ConfigType } from '../../config';

@Injectable()
export class AccessoryFactory {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  buildGoveeAccessory<States extends DeviceStatesType>(
    device: Device<States>,
    accessory: PlatformAccessory,
    deviceConfig: PartialBehaviorSubject<ConfigType<States>>,
  ): GoveeAccessory<States> {
    const processEffects = (
      effects: LightEffect[] | DiyEffect[],
      event: Type,
    ) => {
      effects.forEach(
        async (effect) =>
          await this.eventEmitter.emitAsync(
            event.name,
            new event(device, effect),
          ),
      );
    };
    const effects =
      device.state<LightEffectState>(LightEffectStateName)?.effects;
    processEffects(
      Array.from(effects?.values() ?? []),
      LightEffectDiscoveredEvent,
    );
    effects?.delta$?.subscribe((delta) => {
      processEffects(
        Array.from(delta.added.values()),
        LightEffectDiscoveredEvent,
      );
      processEffects(
        Array.from(delta.deleted.values()),
        LightEffectRemovedEvent,
      );
    });
    const diys = device.state<DiyModeState>(DiyModeStateName)?.effects;
    processEffects(Array.from(diys?.values() ?? []), DiyEffectDiscoveredEvent);
    diys?.delta$?.subscribe((delta) => {
      processEffects(
        Array.from(delta.added.values()),
        DiyEffectDiscoveredEvent,
      );
      processEffects(Array.from(delta.deleted.values()), DiyEffectRemovedEvent);
    });

    return new GoveeAccessory(device, accessory, deviceConfig);
  }
}

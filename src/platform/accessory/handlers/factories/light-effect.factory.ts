import {
  Device,
  LightEffect,
  LightEffectState,
  LightEffectStateName,
  RGBICLight,
  RGBICLightDevice,
} from '@constructorfleet/ultimate-govee';
import { SubServiceHandlerFactory } from '../handler.factory';
import {
  ServiceType,
  ServiceCharacteristicHandlerFactory,
  IsServiceEnabled,
  ServiceSubTypes,
  ServiceName,
} from '../handler.types';
import { Service, Characteristic } from 'hap-nodejs';
import { ConfigType, LightEffectConfig } from '../../../../config';
import { Injectable } from '@nestjs/common';
import { GoveeAccessory } from '../../govee.accessory';
import { HandlerRegistry } from '../handler.registry';

@HandlerRegistry.factoryFor(RGBICLightDevice)
@Injectable()
export class LightEffectFactory extends SubServiceHandlerFactory<RGBICLight> {
  protected serviceType: ServiceType = Service.Switch;
  protected readonly isPrimary: boolean = false;
  protected handlers: ServiceCharacteristicHandlerFactory<RGBICLight> = (
    device: Device<RGBICLight>,
    subType: string,
  ) => ({
    [LightEffectStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: LightEffect, { device }) => {
          const state = device.state<LightEffectState>(LightEffectStateName);
          const activeCode = state?.activeEffectCode?.getValue();
          if (state === undefined || activeCode === undefined) {
            return undefined;
          }
          return value?.code?.toString() === subType;
        },
        onSet: (value) => {
          if (value === true) {
            return {
              code: Number.parseInt(subType),
            };
          }
        },
      },
      {
        characteristic: Characteristic.Name,
        updateValue: (value: LightEffect, { device, service }) => {
          const effect = Array.from(
            device
              .state<LightEffectState>(LightEffectStateName)
              ?.effects?.values() ?? [],
          ).find((effect) => effect.code?.toString() === subType);
          if (effect === undefined) {
            return;
          }
          if (effect.name !== undefined) {
            service.displayName = effect.name;
          }
          return `${device.name} ${effect.name}`;
        },
      },
    ],
  });
  isEnabled: IsServiceEnabled<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
    subType?: string,
  ) => {
    const config: ConfigType<RGBICLight> = accessory.deviceConfig.getValue();
    if (config === undefined || config.ignore) {
      return false;
    }
    if ('effects' in config) {
      const enabledEffects = (config.effects as LightEffectConfig[])
        .filter((effect) => effect.enabled)
        .map((e) => e.code.toString());
      return enabledEffects.includes(subType ?? '');
    }
    return false;
  };
  protected possibleSubTypes: ServiceSubTypes<RGBICLight> = (
    device: Device<RGBICLight>,
  ) => {
    return Array.from(
      device.state<LightEffectState>(LightEffectStateName)?.effects?.values() ??
        [],
    )
      .filter((effect) => effect?.code !== undefined)
      .map((effect) => effect.code!.toString());
  };
  protected name: ServiceName<RGBICLight> = (
    device: Device<RGBICLight>,
    subType?: string,
  ) =>
    `${device.name} ${Array.from(device.state<LightEffectState>(LightEffectStateName)?.effects?.values() ?? [])?.find((e) => e.code?.toString() === subType)?.name}`;
}

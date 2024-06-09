import {
  LightEffect,
  LightEffectState,
  LightEffectStateName,
  RGBICLight,
  RGBICLightDevice,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { GoveeAccessory } from '../../govee.accessory';
import { SubServiceHandlerFactory } from '../handler.factory';
import { HandlerRegistry } from '../handler.registry';
import {
  IsServiceEnabled,
  ServiceCharacteristicHandlerFactory,
  ServiceName,
  ServiceSubTypes,
  ServiceType,
} from '../handler.types';
import { LightEffectConfig } from '../../../../config';

const lightPrefix = 'light';

const getSubType = (effect: LightEffectConfig | LightEffect): string =>
  `${lightPrefix}-${effect.code}`;

const getEffectCode = (subType: string) => {
  const [effectType, code] = subType.split('-');
  return {
    effectType,
    code: parseInt(code),
  };
};

@HandlerRegistry.factoryFor(RGBICLightDevice)
@Injectable()
export class LightEffectFactory extends SubServiceHandlerFactory<RGBICLight> {
  protected serviceType: ServiceType = Service.Switch;
  protected readonly isPrimary: boolean = false;
  protected handlers: ServiceCharacteristicHandlerFactory<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
    subType: string,
  ) => ({
    [LightEffectStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: LightEffect) => {
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== lightPrefix) {
            return undefined;
          }
          const state =
            accessory.device.state<LightEffectState>(LightEffectStateName);
          const activeCode = state?.activeEffectCode?.getValue();
          if (state === undefined || activeCode === undefined) {
            return undefined;
          }
          return value?.code === code;
        },
        onSet: (value) => {
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== lightPrefix) {
            return undefined;
          }
          if (value === true) {
            return {
              code,
            };
          }
        },
      },
      {
        characteristic: Characteristic.Name,
        updateValue: (_: LightEffect, { accessory, service }) => {
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== lightPrefix) {
            return undefined;
          }
          const effect = accessory.lightEffects.get(code);
          if (effect === undefined || effect.name === undefined) {
            return;
          }
          service.displayName = effect.name;
          return effect.name;
        },
      },
    ],
  });
  isEnabled: IsServiceEnabled<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
    subType?: string,
  ) => {
    if (subType === undefined) {
      return false;
    }
    const { effectType, code } = getEffectCode(subType);
    if (accessory.isIgnored || effectType !== lightPrefix) {
      return false;
    }
    return accessory.lightEffects.get(code)?.isExposed === true;
  };
  protected possibleSubTypes: ServiceSubTypes<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
  ) => {
    return Array.from(
      accessory.device
        .state<LightEffectState>(LightEffectStateName)
        ?.effects?.values() ?? [],
    )
      .filter((effect) => effect?.code !== undefined)
      .map((effect) => getSubType(effect));
  };
  protected name: ServiceName<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
    subType?: string,
  ) => {
    if (subType === undefined) {
      return '';
    }
    const { effectType, code } = getEffectCode(subType);
    if (effectType !== lightPrefix) {
      return '';
    }
    return accessory.lightEffects.get(code)?.name ?? '';
  };
}

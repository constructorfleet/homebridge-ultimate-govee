import {
  DiyEffect,
  DiyModeState,
  DiyModeStateName,
  RGBICLight,
  RGBICLightDevice,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { DiyEffectConfig } from '../../../../config';
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

const diyPrefix = 'diy';

const getSubType = (effect: DiyEffectConfig | DiyEffect): string =>
  `${diyPrefix}-${effect.code}`;

const getEffectCode = (subType: string) => {
  const [effectType, code] = subType.split('-');
  return {
    effectType,
    code: parseInt(code),
  };
};

@HandlerRegistry.factoryFor(RGBICLightDevice)
@Injectable()
export class DiyEffectFactory extends SubServiceHandlerFactory<RGBICLight> {
  protected serviceType: ServiceType = Service.Switch;
  protected readonly isPrimary: boolean = false;
  protected handlers: ServiceCharacteristicHandlerFactory<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
    subType: string,
  ) => ({
    [DiyModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: DiyEffect) => {
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== diyPrefix) {
            return undefined;
          }
          const state = accessory.device.state<DiyModeState>(DiyModeStateName);
          const activeCode = state?.activeEffectCode?.getValue();
          if (state === undefined || activeCode === undefined) {
            return undefined;
          }
          return value?.code === code;
        },
        onSet: (value) => {
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== diyPrefix) {
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
        updateValue: (_: DiyEffect, { accessory, service }) => {
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== diyPrefix) {
            return undefined;
          }
          const effect = accessory.diyEffects.get(code);
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
    if (accessory.isIgnored || effectType !== diyPrefix) {
      return false;
    }
    return accessory.diyEffects.get(code)?.isExposed === true;
  };
  protected possibleSubTypes: ServiceSubTypes<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
  ) => {
    return Array.from(
      accessory.device
        .state<DiyModeState>(DiyModeStateName)
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
    if (effectType !== diyPrefix) {
      return '';
    }
    return accessory.diyEffects.get(code)?.name ?? '';
  };
}

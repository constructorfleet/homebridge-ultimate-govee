import {
  DiyModeState,
  DiyModeStateName,
  LightEffect,
  LightEffectState,
  LightEffectStateName,
  RGBICLight,
  RGBICLightDevice,
  DeviceState,
  Optional,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { LightEffectConfig } from '../../../../config';
import { GoveeAccessory } from '../../govee.accessory';
import { SubServiceHandlerFactory } from '../handler.factory';
import { HandlerRegistry } from '../handler.registry';
import {
  CharacteristicType,
  IsServiceEnabled,
  ServiceCharacteristicHandlerFactory,
  ServiceName,
  ServiceSubTypes,
  ServiceType,
} from '../handler.types';
import { ModeStateName } from '@constructorfleet/ultimate-govee/dist/domain';
import { RGBICActiveState } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/lights/rgbic/rgbic-light.modes';

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
  protected readonly optionalCharacteristics: CharacteristicType[] = [
    Characteristic.ConfiguredName,
  ];
  protected handlers: ServiceCharacteristicHandlerFactory<RGBICLight> = (
    accessory: GoveeAccessory<RGBICLight>,
    subType: string,
  ) => ({
    [ModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: Optional<DeviceState<string, any>>) => {
          if (!value || value?.name !== DiyModeStateName) {
            return false;
          }
          return undefined;
        },
      },
    ],
    [LightEffectStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: LightEffect, { accessory }) => {
          const activeMode =
            accessory.device.state<RGBICActiveState>(ModeStateName)?.activeMode;
          if (!activeMode || activeMode?.name !== DiyModeStateName) {
            return false;
          }
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== lightPrefix) {
            return false;
          }
          const state = activeMode as DiyModeState;
          const activeCode = state?.activeEffectCode?.getValue();
          if (state === undefined || activeCode === undefined) {
            return false;
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
      return 'Unknown';
    }
    const { effectType, code } = getEffectCode(subType);
    if (effectType !== lightPrefix) {
      return subType;
    }

    const name =
      accessory.lightEffects.get(code)?.name ??
      accessory.device
        .state<LightEffectState>(LightEffectStateName)
        ?.effects?.get(code)?.name ??
      `${accessory.name} ${code}`;

    return name;
  };
}

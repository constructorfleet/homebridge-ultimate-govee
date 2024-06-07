import {
  DiyEffect,
  DiyModeState,
  DiyModeStateName,
  Optional,
  RGBICLight,
  RGBICLightDevice,
  DeviceState,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { DiyEffectConfig } from '../../../../config';
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
import { RGBICActiveState } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/lights/rgbic/rgbic-light.modes';
import { ModeStateName } from '@constructorfleet/ultimate-govee/dist/domain';

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
    [DiyModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: DiyEffect, { accessory }) => {
          const activeMode =
            accessory.device.state<RGBICActiveState>(ModeStateName)?.activeMode;
          if (!activeMode || activeMode?.name !== DiyModeStateName) {
            return false;
          }
          const { effectType, code } = getEffectCode(subType);
          if (effectType !== diyPrefix) {
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
      return 'Unknown';
    }
    const { effectType, code } = getEffectCode(subType);
    if (effectType !== diyPrefix) {
      return subType;
    }

    const name =
      accessory.lightEffects.get(code)?.name ??
      accessory.device.state<DiyModeState>(DiyModeStateName)?.effects?.get(code)
        ?.name ??
      `${accessory.name} ${code}`;

    return name;
  };
}

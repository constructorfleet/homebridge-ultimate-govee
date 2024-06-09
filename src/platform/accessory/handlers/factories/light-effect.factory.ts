import {
  DeviceState,
  DiyEffect,
  DiyModeStateName,
  LightEffect,
  LightEffectState,
  LightEffectStateName,
  ModeStateName,
  Optional,
  RGBICActiveState,
  RGBICLight,
  RGBICLightDevice,
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

const isEffectOn = (
  subType: string,
  accessory: GoveeAccessory<any>,
): Optional<boolean> => {
  const activeMode = accessory.device.state<RGBICActiveState>(ModeStateName);
  const effectMode =
    accessory.device.state<LightEffectState>(LightEffectStateName);

  if (activeMode?.value?.name === undefined || effectMode?.name === undefined) {
    return undefined;
  }

  if (activeMode?.value?.name !== LightEffectStateName) {
    return false;
  }

  const { effectType, code } = getEffectCode(subType);
  if (effectType !== lightPrefix) {
    return undefined;
  }
  const activeCode =
    effectMode?.value?.code ?? effectMode?.activeEffectCode?.value;

  return activeCode === undefined ? undefined : activeCode === code;
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
        updateValue: (value: DeviceState<string, any>) => {
          if (accessory.device.id === '5F:D3:7C:A6:B0:4A:17:8C') {
            this.logger.warn({
              device: {
                id: accessory.device.id,
                name: accessory.device.name,
              },
              mode: {
                name: value?.name,
              },
            });
          }
          if (value === undefined) {
            return undefined;
          }
          if (value?.name !== LightEffectStateName) {
            return false;
          }
          return isEffectOn(subType, accessory);
        },
      },
    ],
    [LightEffectStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (effect: LightEffect, { accessory }) => {
          if (accessory.device.id === '5F:D3:7C:A6:B0:4A:17:8C') {
            this.logger.warn({
              device: {
                id: accessory.device.id,
                name: accessory.device.name,
              },
              lightEffect: effect,
            });
          }
          if (effect?.code === getEffectCode(subType).code) {
            return true;
          }
          return isEffectOn(subType, accessory);
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
    [DiyModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (diyEffect: Optional<Partial<DiyEffect>>) => {
          if (diyEffect?.code === undefined) {
            return undefined;
          }
          return false;
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

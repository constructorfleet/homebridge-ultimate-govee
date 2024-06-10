import {
  DeviceState,
  DiyEffect,
  DiyModeState,
  DiyModeStateName,
  LightEffect,
  LightEffectStateName,
  ModeStateName,
  Optional,
  RGBICActiveState,
  RGBICLight,
  RGBICLightDevice,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { DiyEffectConfig, RGBLightDeviceConfig } from '../../../../config';
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

const isEffectOn = (
  subType: string,
  accessory: GoveeAccessory<any>,
): Optional<boolean> => {
  const activeMode = accessory.device.state<RGBICActiveState>(ModeStateName);
  const effectMode = accessory.device.state<DiyModeState>(DiyModeStateName);

  if (
    activeMode?.value?.name === undefined ||
    !effectMode?.name === undefined
  ) {
    return undefined;
  }

  if (activeMode?.value?.name !== DiyModeStateName) {
    return false;
  }

  const { effectType, code } = getEffectCode(subType);
  if (effectType !== diyPrefix) {
    return undefined;
  }
  const activeCode =
    effectMode?.value?.code ?? effectMode?.activeEffectCode?.value;

  return activeCode === undefined ? undefined : activeCode === code;
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
        updateValue: (value: DeviceState<string, any>) => {
          if (value === undefined) {
            return undefined;
          }
          if (value?.name !== DiyModeStateName) {
            return false;
          }
          return isEffectOn(subType, accessory);
        },
      },
    ],
    [DiyModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (effect: Optional<Partial<DiyEffect>>, { accessory }) => {
          if (effect?.code === getEffectCode(subType).code) {
            return true;
          }
          return isEffectOn(subType, accessory);
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
    [LightEffectStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (effect: Optional<Partial<LightEffect>>) => {
          if (effect?.code === undefined) {
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
      accessory.diyEffects.get(code)?.name ??
      (accessory.deviceConfig as RGBLightDeviceConfig)?.diy[code]?.name ??
      accessory.device.state<DiyModeState>(DiyModeStateName)?.effects?.get(code)
        ?.name ??
      `${accessory.name} ${code}`;

    return name;
  };
}

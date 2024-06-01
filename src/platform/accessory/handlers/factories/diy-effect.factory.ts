import {
  DeltaMap,
  Device,
  DiyEffect,
  DiyModeState,
  DiyModeStateName,
  RGBICLight,
  RGBICLightDevice,
} from '@constructorfleet/ultimate-govee';
import { Injectable } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { ConfigType, DiyEffectConfig } from '../../../../config';
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

@HandlerRegistry.factoryFor(RGBICLightDevice)
@Injectable()
export class DiyEffectFactory extends SubServiceHandlerFactory<RGBICLight> {
  protected serviceType: ServiceType = Service.Switch;
  protected readonly isPrimary: boolean = false;
  protected handlers: ServiceCharacteristicHandlerFactory<RGBICLight> = (
    device: Device<RGBICLight>,
    subType: string,
  ) => ({
    [DiyModeStateName]: [
      {
        characteristic: Characteristic.On,
        updateValue: (value: DiyEffect, { device }) => {
          const state = device.state<DiyModeState>(DiyModeStateName);
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
        updateValue: (value: DiyEffect, { device, service }) => {
          const effect = Array.from(
            device.state<DiyModeState>(DiyModeStateName)?.effects?.values() ??
              [],
          ).find((effect) => effect.code?.toString() === subType);
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
    const config: ConfigType<RGBICLight> = accessory.deviceConfig.getValue();
    if (config === undefined || config.ignore) {
      return false;
    }
    if ('diy' in config) {
      const enabledEffects =
        Array.from((config.diy as DeltaMap<number, DiyEffectConfig>).values())
          ?.filter((effect) => effect.enabled)
          ?.map((e) => e.code.toString()) ?? [];
      return enabledEffects.includes(subType ?? '');
    }
    return false;
  };
  protected possibleSubTypes: ServiceSubTypes<RGBICLight> = (
    device: Device<RGBICLight>,
  ) => {
    return Array.from(
      device.state<DiyModeState>(DiyModeStateName)?.effects?.values() ?? [],
    )
      .filter((effect) => effect?.code !== undefined)
      .map((effect) => effect.code!.toString());
  };
  protected name: ServiceName<RGBICLight> = (
    device: Device<RGBICLight>,
    subType?: string,
  ) =>
    `${device.name} DIY ${Array.from(device.state<DiyModeState>(DiyModeStateName)?.effects?.values() ?? [])?.find((e) => e.code?.toString() === subType)?.name}`;
}

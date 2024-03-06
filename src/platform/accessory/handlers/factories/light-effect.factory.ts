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
  EnabledWhen,
  ServiceSubTypes,
  ServiceName,
} from '../handler.types';
import { Service, Characteristic } from 'hap-nodejs';
import { PlatformAccessory } from 'homebridge';
import { DeviceConfig, RGBICLightDeviceConfig } from '../../../../config';
import { Injectable } from '@nestjs/common';
import { HandlerRegistry } from '../handler.registry';

@HandlerRegistry.factoryFor(RGBICLightDevice)
@Injectable()
export class LightEffectFactory extends SubServiceHandlerFactory<RGBICLight> {
  protected serviceType: ServiceType = Service.Switch;
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
          return value?.name === subType;
        },
        onSet: (value, { device }) => {
          if (value === true) {
            const effect = Array.from(
              device
                .state<LightEffectState>(LightEffectStateName)
                ?.effects?.values() ?? [],
            ).find((effect) => effect.name === subType);
            if (effect === undefined) {
              return undefined;
            }
            return effect;
          }
        },
      },
    ],
  });
  protected isEnabled: EnabledWhen<RGBICLight> = (
    accessory: PlatformAccessory,
    _: Device<RGBICLight>,
    subType?: string,
  ) => {
    const config: DeviceConfig = accessory.context.deviceConfig;
    if (config === undefined || config.ignore) {
      return false;
    }
    if (config instanceof RGBICLightDeviceConfig) {
      const effect = (config as RGBICLightDeviceConfig).effects.find(
        (effect) => effect.name === subType,
      );
      return effect !== undefined && effect.name === subType;
    }
    return false;
  };
  protected possibleSubTypes: ServiceSubTypes<RGBICLight> = (
    device: Device<RGBICLight>,
  ) =>
    Array.from(
      device.state<LightEffectState>(LightEffectStateName)?.effects?.values() ??
        [],
    )
      .filter((effect) => effect?.name !== undefined)
      .map((effect) => effect.name!);
  protected name: ServiceName<RGBICLight> = (
    device: Device<RGBICLight>,
    subType?: string,
  ) => `${device.name} ${subType}`;
}

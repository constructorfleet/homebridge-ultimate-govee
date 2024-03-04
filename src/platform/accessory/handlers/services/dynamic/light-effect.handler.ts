import {
  Device,
  DeviceStatesType,
  RGBICLightDevice,
} from '@constructorfleet/ultimate-govee';
import {
  LightEffect as GoveeLightEffect,
  LightEffectState,
  LightEffectStateName,
} from '@constructorfleet/ultimate-govee/dist/domain';
import { Characteristic, Service } from 'hap-nodejs';
import { DynamicServiceHandler, ServiceHandler } from '../../service.handler';
import { WithUUID } from 'homebridge';
import { ClassConstructor } from 'class-transformer';
import { Type, mixin } from '@nestjs/common';
import { CharacteristicHandler } from '../../characteristic.handler';
import { HandlerRegistry } from '../../handler.registry';

export const LightEffectHandlerFactory: DynamicServiceHandler<
  DeviceStatesType,
  WithUUID<Service>
> = (
  device: Device<any>,
): Type<ServiceHandler<DeviceStatesType, WithUUID<Service>>>[] => {
  const lightEffects =
    device.state<LightEffectState>(LightEffectStateName)?.effects;
  if (lightEffects === undefined) {
    return [];
  }

  return Array.from(lightEffects.values() ?? [])
    ?.map((effect) => LightEffectHandler(effect))
    ?.slice(10);
};

export const LightEffectHandler = (
  effect: GoveeLightEffect,
): Type<ServiceHandler<DeviceStatesType, WithUUID<Service>>> => {
  class LightEffectHandler extends ServiceHandler<
    DeviceStatesType,
    WithUUID<Service>
  > {
    readonly serviceType: WithUUID<ClassConstructor<WithUUID<Service>>> =
      Service.Switch;
    readonly handlers: Partial<
      Record<
        string | number,
        CharacteristicHandler<WithUUID<Type<Characteristic>>, any>[]
      >
    > = {
      [LightEffectStateName]: [
        {
          characteristic: Characteristic.Name,
          updateValue: () => effect.name ?? 'Unknown Effect',
        },
        {
          characteristic: Characteristic.On,
          updateValue: (value) => {
            const { code } = value;
            if (effect.code === undefined || code === undefined) {
              return undefined;
            }
            return code === effect.code;
          },
          onSet: (value) => ({
            code: value as number,
          }),
        },
      ],
    };
    readonly subType: string | undefined = effect.name;
    readonly link: boolean = true;
  }

  return mixin(LightEffectHandler);
};

HandlerRegistry.forDeviceDynamic(LightEffectHandlerFactory, RGBICLightDevice);

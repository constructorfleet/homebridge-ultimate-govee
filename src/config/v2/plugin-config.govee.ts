import {
  Device,
  DeviceStatesType,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import {
  ClassConstructor,
  Expose,
  Transform,
  Type,
  plainToInstance,
} from 'class-transformer';
import { plainToSingleInstance } from '../../common';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { ConfigType, PluginDeviceConfig } from '../plugin-config.types';
import { ControlChannels } from './control-channel.config';
import { GoveeCredentials } from './credentials.config';
import {
  DiyEffectConfig,
  LightEffectConfig,
  RGBICLightDeviceConfig,
  RGBLightDeviceConfig,
} from './devices';
import { DeviceConfig } from './devices/device.config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DiyEffectDiscoveredEvent,
  LightEffectDiscoveredEvent,
} from '../../events';

export const buildDeviceConfig = (
  value: PluginDeviceConfig,
): DeviceConfig | undefined => {
  if (value === undefined || !(typeof value !== 'object')) {
    return undefined;
  }
  const type: string =
    '_type' in (value as object)
      ? (value as { _type: string })._type
      : 'showSegments' in (value as object)
        ? 'rgbic'
        : 'effects' in (value as object)
          ? 'rgb'
          : 'device';
  const valObj = {
    ...(value as object),
    _type: type,
  };
  switch (valObj._type) {
    case 'rgbic':
      return plainToSingleInstance(
        RGBICLightDeviceConfig,
        value,
      ) as RGBICLightDeviceConfig;
    case 'rgb':
      return plainToSingleInstance(
        RGBLightDeviceConfig,
        value,
      ) as RGBLightDeviceConfig;
    default:
      return plainToSingleInstance(DeviceConfig, value);
  }
};

export const configFromDevice = <
  States extends DeviceStatesType,
  T extends Device<States>,
>(
  device: T,
  eventEmitter: EventEmitter2,
): ConfigType<States> => {
  const config: ConfigType<States> =
    device instanceof RGBICLightDevice
      ? new RGBICLightDeviceConfig()
      : device instanceof RGBLightDevice
        ? new RGBLightDeviceConfig()
        : new DeviceConfig();
  config.id = device.id;
  config.name = device.name;
  config.type =
    device instanceof RGBICLightDevice
      ? 'rgbic'
      : device instanceof RGBLightDevice
        ? 'rgb'
        : 'device';

  if (device instanceof RGBICLightDevice) {
    const lightDevice: RGBICLightDevice = device;
    const lightEffectState = lightDevice.lightEffect;
    const diyEffectState = lightDevice.diyEffect;
    const lightEffects = Array.from(
      lightEffectState?.effects.values() ?? [],
    ).filter(
      (effect) => effect.code !== undefined && effect.name !== undefined,
    );
    const diyEffects = Array.from(
      diyEffectState?.effects.values() ?? [],
    ).filter(
      (effect) => effect.code !== undefined && effect.name !== undefined,
    );
    lightEffects.forEach(
      async (effect) =>
        await eventEmitter.emitAsync(
          LightEffectDiscoveredEvent.name,
          new LightEffectDiscoveredEvent(device, effect),
        ),
    );
    diyEffects.forEach(
      async (effect) =>
        await eventEmitter.emitAsync(
          DiyEffectDiscoveredEvent.name,
          new DiyEffectDiscoveredEvent(device, effect),
        ),
    );
    const lightConfig = config as RGBICLightDeviceConfig;
    lightConfig.effects = new Map(
      lightEffects.map((effect) => [
        effect.code!,
        LightEffectConfig.from(effect)!,
      ]),
    );
    lightConfig.diy = new Map(
      diyEffects.map((effect) => [effect.code!, DiyEffectConfig.from(effect)!]),
    );
    return lightConfig;
  }

  return config;
};

export class GoveePluginConfig {
  @Expose({ name: 'version' })
  version: number = 2;

  @Expose({ name: 'name' })
  name: string = PLUGIN_NAME;

  @Expose({ name: 'platform' })
  platform: string = PLATFORM_NAME;

  @Expose({ name: 'credentials' })
  @Type(() => GoveeCredentials)
  credentials!: GoveeCredentials;

  @Expose({ name: 'controlChannels' })
  @Type(() => ControlChannels)
  controlChannels!: ControlChannels;

  @Expose({ name: 'deviceConfigs' })
  @Transform(
    ({
      value,
    }: {
      value: Record<
        string,
        RGBICLightDeviceConfig | RGBLightDeviceConfig | DeviceConfig
      >;
    }) => Object.values(value).filter((e) => e.id !== undefined),
    { toPlainOnly: true },
  )
  @Transform(
    ({ value }: { value: { _type: string; id: string }[] }) =>
      value.reduce(
        (acc, cur) => {
          if (cur.id === undefined) {
            return acc;
          }
          let type: ClassConstructor<
            RGBICLightDeviceConfig | RGBLightDeviceConfig | DeviceConfig
          >;
          switch (cur._type) {
            case 'rgbic':
              type = RGBICLightDeviceConfig;
              break;
            case 'rgb':
              type = RGBLightDeviceConfig;
              break;
            default:
              type = DeviceConfig;
              break;
          }
          const config:
            | RGBICLightDeviceConfig
            | RGBLightDeviceConfig
            | DeviceConfig = plainToInstance(type, cur);
          acc[config.id] = config;
          return acc;
        },
        {} as Record<
          string,
          DeviceConfig | RGBLightDeviceConfig | RGBICLightDeviceConfig
        >,
      ),
    {
      toClassOnly: true,
    },
  )
  deviceConfigs!: Record<
    string,
    DeviceConfig | RGBLightDeviceConfig | RGBICLightDeviceConfig
  >;

  get isValid(): boolean {
    return ![
      this.credentials.username,
      this.credentials.password,
      this.controlChannels.ble,
      this.controlChannels.iot,
    ].includes(undefined);
  }
}

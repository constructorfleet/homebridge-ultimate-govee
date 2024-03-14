import { Exclude, Expose, Type } from 'class-transformer';
import { GoveeCredentials } from './credentials.config';
import { ControlChannels } from './control-channel.config';
import { DeviceConfig } from './devices/device.config';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import {
  LightEffectConfig,
  RGBICLightDeviceConfig,
  RGBLightDeviceConfig,
} from './devices';
import { PluginDeviceConfig } from '../plugin-config.types';
import { plainToSingleInstance, using } from '../../common';
import {
  Device,
  DeviceStatesType,
  LightEffectState,
  LightEffectStateName,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
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
  pluginConfig: GoveePluginConfig,
): DeviceConfig => {
  const config =
    device instanceof RGBICLightDevice
      ? new RGBICLightDeviceConfig()
      : device instanceof RGBLightDevice
        ? new RGBLightDeviceConfig()
        : new DeviceConfig();
  return using(config).do((config) => {
    config.id = device.id;
    config.name = device.name;
    config.type = 'device';
    if (config instanceof RGBLightDeviceConfig) {
      config.type = 'rgb';
      Array.from(
        device
          .state<LightEffectState>(LightEffectStateName)
          ?.effects?.values() ?? [],
      ).forEach((effect) => {
        if (effect.name === undefined || effect.code === undefined) {
          return;
        }

        config.effects.push(
          using(new LightEffectConfig()).do((effectConfig) => {
            effectConfig.name = effect.name!;
            effectConfig.code = effect.code!;
            effectConfig.enabled = false;
          }),
        );
      });
      if (config instanceof RGBICLightDeviceConfig) {
        config.showSegments = false;
        config.type = 'rgbic';
      }
    }
    pluginConfig.deviceConfigs.push(config);
  });
};

export class GoveePluginConfig {
  @Expose({ name: '_version' })
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
  @Type(() => DeviceConfig, {
    discriminator: {
      property: '_type',
      subTypes: [
        { name: 'rgb', value: RGBLightDeviceConfig },
        { name: 'rgbic', value: RGBICLightDeviceConfig },
        { name: 'device', value: DeviceConfig },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  deviceConfigs!: (
    | DeviceConfig
    | RGBLightDeviceConfig
    | RGBICLightDeviceConfig
  )[];

  @Exclude()
  get deviceConfigMap(): Map<
    string,
    DeviceConfig | RGBLightDeviceConfig | RGBICLightDeviceConfig
  > {
    return this.deviceConfigs.reduce((m, curr) => {
      m.set(curr.id, curr);
      return m;
    }, new Map());
  }

  get isValid(): boolean {
    return ![
      this.credentials.username,
      this.credentials.password,
      this.controlChannels.ble,
      this.controlChannels.iot,
    ].includes(undefined);
  }
}

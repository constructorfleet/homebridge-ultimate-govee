import {
  ClassConstructor,
  Expose,
  Transform,
  Type,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';
import { plainToSingleInstance } from '../../common';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { PluginDeviceConfig } from '../plugin-config.types';
import { ControlChannels } from './control-channel.config';
import { GoveeCredentials } from './credentials.config';
import { RGBICLightDeviceConfig, RGBLightDeviceConfig } from './devices';
import { DeviceConfig } from './devices/device.config';

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
    }) =>
      Object.values(value)
        .filter((e) => e.id !== undefined)
        .map((e) => instanceToPlain(e)),
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

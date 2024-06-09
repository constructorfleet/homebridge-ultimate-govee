import { DiyEffect, LightEffect } from '@constructorfleet/ultimate-govee';
import { Expose, Transform, instanceToPlain } from 'class-transformer';
import { using } from '../../../common';
import { DeviceConfig } from './device.config';

export class LightEffectConfig {
  static from(
    effect: LightEffect,
    deviceConfig?: RGBLightDeviceConfig,
  ): LightEffectConfig | undefined {
    if (effect?.code === undefined || effect?.name === undefined) {
      return undefined;
    }
    const effectConfig = deviceConfig?.effects[effect.code];
    const config = new LightEffectConfig();
    config.code = effect.code;
    config.name = effectConfig?.name ?? effect.name;
    config.enabled = effectConfig?.enabled ?? false;
    return config;
  }

  @Expose({ name: 'name' })
  name!: string;

  @Expose({ name: 'code' })
  code!: number;

  @Expose({ name: 'enabled' })
  enabled!: boolean;
}

export class DiyEffectConfig {
  static from(
    effect: DiyEffect,
    deviceConfig?: RGBLightDeviceConfig,
  ): DiyEffectConfig | undefined {
    if (effect?.code === undefined || effect?.name === undefined) {
      return undefined;
    }

    const effectConfig = deviceConfig?.effects[effect.code];
    const config = new LightEffectConfig();
    config.code = effect.code;
    config.name = effectConfig?.name ?? effect.name;
    config.enabled = effectConfig?.enabled ?? false;
    return config;
  }

  @Expose({ name: 'name' })
  name!: string;

  @Expose({ name: 'code' })
  code!: number;

  @Expose({ name: 'enabled' })
  enabled!: boolean;
}

export class RGBLightDeviceConfig extends DeviceConfig {
  @Expose({ name: '_type' })
  type: string = 'rgb';

  @Expose({ name: 'effects' })
  @Transform(
    ({ value }: { value: Record<string, LightEffectConfig> }) =>
      Object.values(value ?? {})
        .filter((e) => !!e.code && !!e.name)
        .map((e) => instanceToPlain(e)),
    { toPlainOnly: true },
  )
  @Transform(
    ({
      value,
    }: {
      value?: { code?: number; name?: string; enabled?: boolean }[];
    }) =>
      value?.reduce(
        (acc, cur) => {
          if (cur.code === undefined || cur.name === undefined) {
            return acc;
          }

          acc[cur.code] = using(new LightEffectConfig()).do((config) => {
            config.code = cur.code!;
            config.name = cur.name!;
            config.enabled = cur.enabled === true;
          });
          return acc;
        },
        {} as Record<string, LightEffectConfig>,
      ) ?? ({} as Record<string, LightEffectConfig>),
    {
      toClassOnly: true,
    },
  )
  effects!: Record<number, LightEffectConfig>;

  @Expose({ name: 'diy' })
  @Transform(
    ({ value }: { value: Record<string, DiyEffectConfig> }) =>
      Object.values(value ?? {})
        .filter((e) => !!e.code && !!e.name)
        .map((e) => instanceToPlain(e)),
    { toPlainOnly: true },
  )
  @Transform(
    ({
      value,
    }: {
      value?: { code?: number; name?: string; enabled?: boolean }[];
    }) =>
      value?.reduce(
        (acc, cur) => {
          if (cur.code === undefined || cur.name === undefined) {
            return acc;
          }

          acc[cur.code] = using(new DiyEffectConfig()).do((config) => {
            config.code = cur.code!;
            config.name = cur.name!;
            config.enabled = cur.enabled === true;
          });
          return acc;
        },
        {} as Record<string, DiyEffectConfig>,
      ) ?? ({} as Record<string, DiyEffect>),
    {
      toClassOnly: true,
    },
  )
  diy!: Record<number, DiyEffectConfig>;
}

export class RGBICLightDeviceConfig extends RGBLightDeviceConfig {
  @Expose({ name: '_type' })
  type: string = 'rgbic';

  @Expose({ name: 'segments' })
  showSegments!: boolean;
}

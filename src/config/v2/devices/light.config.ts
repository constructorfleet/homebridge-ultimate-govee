import { DiyEffect, LightEffect } from '@constructorfleet/ultimate-govee';
import {
  Expose,
  Transform,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';
import { DeviceConfig } from './device.config';

export class LightEffectConfig {
  static from(effect: LightEffect): LightEffectConfig | undefined {
    if (effect.code === undefined || effect.name === undefined) {
      return undefined;
    }

    const config = new LightEffectConfig();
    config.code = effect.code;
    config.name = effect.name;
    config.enabled = false;
    return config;
  }
  @Expose({ name: 'name' })
  name!: string;

  @Expose({ name: 'code' })
  code!: number;

  @Expose({ name: 'description' })
  description?: string;

  @Expose({ name: 'enabled' })
  enabled!: boolean;
}

export class DiyEffectConfig {
  static from(effect: DiyEffect): DiyEffectConfig | undefined {
    if (effect.code === undefined || effect.name === undefined) {
      return undefined;
    }

    const config = new DiyEffectConfig();
    config.code = effect.code;
    config.name = effect.name;
    config.enabled = false;
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
    ({ value }: { value: Record<string, unknown>[] }) => {
      if (value === undefined) {
        return new Map<number, LightEffectConfig>();
      }
      const effectConfig = plainToInstance(LightEffectConfig, value);
      return new Map<number, LightEffectConfig>(
        effectConfig
          .filter(
            (effect) => effect.code !== undefined && effect.name !== undefined,
          )
          .map((effect) => [effect.code, effect]),
      );
    },
    {
      toClassOnly: true,
    },
  )
  @Transform(
    ({ value }: { value?: Map<number, LightEffectConfig> }) =>
      Array.from(value?.values() ?? []).map((effect) =>
        instanceToPlain(effect),
      ),
    {
      toPlainOnly: true,
    },
  )
  effects!: Map<number, LightEffectConfig>;

  @Expose({ name: 'diy' })
  @Transform(
    ({ value }: { value: Record<string, unknown>[] }) => {
      if (value === undefined) {
        return new Map<number, DiyEffectConfig>();
      }
      const effectConfig = plainToInstance(DiyEffectConfig, value);
      return new Map<number, DiyEffectConfig>(
        effectConfig
          .filter(
            (effect) => effect.code === undefined || effect.name === undefined,
          )
          .map((effect) => [effect.code, effect]),
      );
    },
    {
      toClassOnly: true,
    },
  )
  @Transform(
    ({ value }: { value?: Map<number, DiyEffectConfig> }) =>
      Array.from(value?.values() ?? []).map((effect) =>
        instanceToPlain(effect),
      ),
    {
      toPlainOnly: true,
    },
  )
  diy!: Map<number, DiyEffectConfig>;
}

export class RGBICLightDeviceConfig extends RGBLightDeviceConfig {
  @Expose({ name: '_type' })
  type: string = 'rgbic';

  @Expose({ name: 'segments' })
  showSegments!: boolean;
}

import { Exclude, Expose, Type } from 'class-transformer';
import { DeviceConfig } from './device.config';

export class LightEffectConfig {
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
  @Expose({ name: 'name' })
  name: string = '';

  @Expose({ name: 'code' })
  code: number = 0;
}

export class RGBLightDeviceConfig extends DeviceConfig {
  @Expose({ name: '_type' })
  type: string = 'rgb';

  @Expose({ name: 'effects' })
  @Type(() => LightEffectConfig)
  effects!: LightEffectConfig[];

  @Exclude()
  get effectMap(): Map<number, LightEffectConfig> {
    return this.effects.reduce((m, curr) => {
      m.set(curr.code, curr);
      return m;
    }, new Map());
  }

  @Expose({ name: 'diy' })
  @Type(() => LightEffectConfig)
  diy!: DiyEffectConfig[];
}

export class RGBICLightDeviceConfig extends RGBLightDeviceConfig {
  @Expose({ name: '_type' })
  type: string = 'rgbic';

  @Expose({ name: 'segments' })
  showSegments!: boolean;
}

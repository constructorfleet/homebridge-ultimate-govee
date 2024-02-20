import { Expose, Type } from 'class-transformer';
import { DeviceConfig } from './device.config';

export class LightEffectConfig {
  @Expose({ name: 'name' })
  name: string = '';

  @Expose({ name: 'code' })
  code: number = 0;

  @Expose({ name: 'description' })
  description: string = '';

  @Expose({ name: 'enabled' })
  enabled: boolean = false;
}

export class DiyEffectConfig {
  @Expose({ name: 'name' })
  name: string = '';

  @Expose({ name: 'code' })
  code: number = 0;
}

export class RGBLightDeviceConfig extends DeviceConfig {
  type: string = 'rgb';

  @Expose({ name: 'effects' })
  @Type(() => LightEffectConfig)
  effects: LightEffectConfig[] = [];

  @Expose({ name: 'diy' })
  @Type(() => LightEffectConfig)
  diy: DiyEffectConfig[] = [];
}

export class RGBICLightDeviceConfig extends DeviceConfig {
  type: string = 'rgbic';

  @Expose({ name: 'segments' })
  showSegments: boolean = false;
}

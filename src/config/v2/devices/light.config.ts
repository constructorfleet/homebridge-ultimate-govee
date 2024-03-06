import { Expose, Transform, Type } from 'class-transformer';
import { DeviceConfig } from './device.config';
import { BehaviorSubject } from 'rxjs';

export class LightEffectConfig {
  constructor() {
    this.enabled = new BehaviorSubject(false);
  }
  @Expose({ name: 'name' })
  name: string = '';

  @Expose({ name: 'code' })
  code: number = 0;

  @Expose({ name: 'description' })
  description: string = '';

  @Expose({ name: 'enabled' })
  @Transform(({ value }) => new BehaviorSubject(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  enabled: BehaviorSubject<boolean>;
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
  effects: LightEffectConfig[] = [];

  @Expose({ name: 'diy' })
  @Type(() => LightEffectConfig)
  diy: DiyEffectConfig[] = [];
}

export class RGBICLightDeviceConfig extends RGBLightDeviceConfig {
  constructor() {
    super();
    this.showSegments = new BehaviorSubject(false);
  }
  @Expose({ name: '_type' })
  type: string = 'rgbic';

  @Expose({ name: 'segments' })
  @Transform(({ value }) => new BehaviorSubject(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  showSegments: BehaviorSubject<boolean>;
}

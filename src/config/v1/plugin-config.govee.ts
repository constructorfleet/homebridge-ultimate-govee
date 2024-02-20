import { Exclude, Expose, Type } from 'class-transformer';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';

type LightType = 'WW' | 'RGB' | 'RGBIC';

export class GoveeDeviceOverride {
  @Expose({ name: 'deviceId' })
  deviceId?: string;

  @Expose({ name: 'model' })
  model?: string;

  @Expose({ name: 'ignore' })
  ignore?: boolean;

  @Expose({ name: 'displayName' })
  displayName?: string;
}

export class DIYLightEffect {
  @Expose({ name: 'id' })
  id!: string;

  @Expose({ name: 'name' })
  name!: string;
}

export class DeviceLightEffect {
  @Expose({ name: 'id' })
  id!: number;

  @Expose({ name: 'name' })
  name!: string;

  @Expose({ name: 'description' })
  description!: string;

  @Expose({ name: 'deviceId' })
  deviceId!: string;

  @Expose({ name: 'enabled' })
  enabled!: boolean;
}

export class GoveeLightOverride extends GoveeDeviceOverride {
  @Expose({ name: 'diyEffects' })
  diyEffects?: { DIYLightEffect }[];

  @Expose({ name: 'effects' })
  effects?: DeviceLightEffect[];

  @Expose({ name: '_lightType' })
  _lightType?: LightType;
}

export class GoveeRGBICLightOverride extends GoveeLightOverride {
  @Expose({ name: 'hideSegments' })
  hideSegments?: boolean;
}

export class GoveeDeviceOverrides {
  constructor(
    humidifiers: GoveeDeviceOverride[],
    purifiers: GoveeDeviceOverride[],
    lights: GoveeDeviceOverride[],
  ) {
    this.humidifiers = humidifiers;
    this.airPurifiers = purifiers;
    this.lights = lights;
  }

  @Expose({ name: 'airPurifiers' })
  @Type(() => GoveeDeviceOverrides)
  airPurifiers?: GoveeDeviceOverride[];

  @Expose({ name: 'humidifiers' })
  @Type(() => GoveeDeviceOverrides)
  humidifiers?: GoveeDeviceOverride[];

  @Expose({ name: 'lights' })
  @Type(() => GoveeLightOverride, {
    discriminator: {
      property: '_lightType',
      subTypes: [
        {
          value: GoveeRGBICLightOverride,
          name: 'RGBIC',
        },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  lights?: GoveeDeviceOverride[];
}

export class GoveeConnections {
  @Expose({ name: 'iot' })
  iot = true;

  @Expose({ name: 'ble' })
  ble = true;

  @Expose({ name: 'api' })
  api = true;
}

export class GoveePluginConfig {
  @Expose({ name: 'name' })
  name: string = PLUGIN_NAME;

  @Expose({ name: 'platform' })
  platform: string = PLATFORM_NAME;

  @Expose({ name: 'username' })
  username?: string;

  @Expose({ name: 'password' })
  password?: string;

  @Expose({ name: 'connections' })
  @Type(() => GoveeConnections)
  connections?: GoveeConnections;

  @Expose({ name: 'devices' })
  @Type(() => GoveeDeviceOverrides)
  devices?: GoveeDeviceOverrides;

  @Expose({ name: 'featureFlags' })
  featureFlags!: string[];

  @Exclude()
  isValid(): boolean {
    return this.username !== undefined || this.password !== undefined;
  }
}

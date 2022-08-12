import {GoveeDevice} from '../../devices';
import {PLATFORM_NAME, PLUGIN_NAME} from '../../settings';
import {DeviceLightEffect, DIYLightEffect} from '../../effects';
import {Exclude, Expose, Type} from 'class-transformer';
import {Injectable} from '@nestjs/common';


type LightType = 'WW' | 'RGB' | 'RGBIC';

export class GoveeDeviceOverride {
  @Expose({name: 'deviceId'})
  deviceId?: string;
  @Expose({name: 'model'})
  model?: string;
  @Expose({name: 'ignore'})
  ignore?: boolean;

  constructor(device?: GoveeDevice) {
    this.ignore = false;
    this.deviceId = device?.deviceId;
    this.model = device?.model;
  }
}

export class GoveeLightOverride extends GoveeDeviceOverride {
  @Expose({name: 'diyEffects'})
  diyEffects?: DIYLightEffect[];
  @Expose({name: 'effects'})
  effects?: DeviceLightEffect[];
  @Expose({name: '_lightType'})
  _lightType?: LightType;

  constructor(device?: GoveeDevice) {
    super(device);
    this._lightType = 'RGB';
  }
}

export class GoveeRGBICLightOverride extends GoveeLightOverride {
  @Expose({name: 'hideSegments'})
  hideSegments?: boolean;

  constructor(device?: GoveeDevice) {
    super(device);
    this._lightType = 'RGBIC';
    this.hideSegments = false;
  }
}

export class GoveeDeviceOverrides {
  @Expose({name: 'airPurifiers'})
  @Type(() => GoveeDeviceOverrides)
  airPurifiers?: GoveeDeviceOverride[];
  @Expose({name: 'humidifiers'})
  @Type(() => GoveeDeviceOverrides)
  humidifiers?: GoveeDeviceOverride[];
  @Expose({name: 'lights'})
  @Type(
    () => GoveeLightOverride,
    {
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
    },
  )
  lights?: GoveeDeviceOverride[];

  constructor(
    humidifiers: GoveeDeviceOverride[],
    purifiers: GoveeDeviceOverride[],
    lights: GoveeDeviceOverride[],
  ) {
    this.humidifiers = humidifiers;
    this.airPurifiers = purifiers;
    this.lights = lights;
  }
}

@Injectable()
export class GoveeConnections {
  @Expose({name: 'iot'})
  iot = true;

  @Expose({name: 'ble'})
  ble = true;

  @Expose({name: 'api'})
  api = true;
}

@Injectable()
export class GoveePluginConfig {
  @Expose({name: 'name'})
  name: string = PLUGIN_NAME;

  @Expose({name: 'platform'})
  platform: string = PLATFORM_NAME;

  @Expose({name: 'username'})
  username?: string;

  @Expose({name: 'password'})
  password?: string;

  @Expose({name: 'connections'})
  @Type(() => GoveeConnections)
  connections?: GoveeConnections;

  @Expose({name: 'devices'})
  @Type(() => GoveeDeviceOverrides)
  devices?: GoveeDeviceOverrides;

  @Expose({name: 'featureFlags'})
  featureFlags!: string[];

  @Exclude()
  isValid(): boolean {
    return this.username !== undefined || this.password !== undefined;
  }
}


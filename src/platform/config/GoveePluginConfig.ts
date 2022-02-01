import {Expose, Type} from 'class-transformer';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {PLATFORM_NAME, PLUGIN_NAME} from '../../settings';

export class GoveeDeviceOverride {
  constructor(device: GoveeDevice) {
    this.ignore = false;
    this.deviceId = device.deviceId;
    this.model = device.model;
    this.displayName = device.name;
  }

  @Expose({name: 'deviceId'})
    deviceId?: string;

  @Expose({name: 'model'})
    model?: string;

  @Expose({name: 'ignore'})
    ignore?: boolean;

  @Expose({name: 'displayName'})
    displayName?: string;
}

export class GoveeDeviceOverrides {
  constructor(
    humidifiers: GoveeDeviceOverride[],
    purifiers: GoveeDeviceOverride[],
  ) {
    this.humidifiers = humidifiers;
    this.airPurifiers = purifiers;
  }

  @Expose({name: 'airPurifiers'})
  @Type(() => GoveeDeviceOverrides)
    airPurifiers?: GoveeDeviceOverride[];

  @Expose({name: 'humidifiers'})
  @Type(() => GoveeDeviceOverrides)
    humidifiers?: GoveeDeviceOverride[];
}

export class GoveePluginConfig {
  @Expose({name: 'name'})
    name: string = PLUGIN_NAME;

  @Expose({name: 'platform'})
    platform: string = PLATFORM_NAME;

  @Expose({name: 'username'})
    username?: string;

  @Expose({name: 'password'})
    password?: string;

  @Expose({name: 'devices'})
  @Type(() => GoveeDeviceOverrides)
    devices?: GoveeDeviceOverrides;
}


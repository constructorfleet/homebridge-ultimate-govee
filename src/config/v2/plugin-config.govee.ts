import { Expose, Type } from 'class-transformer';
import { GoveeCredentials } from './credentials.config';
import { ControlChannels } from './control-channel.config';
import { DeviceConfig } from './devices/device.config';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { RGBICLightDeviceConfig, RGBLightDeviceConfig } from './devices';

export class GoveePluginConfig {
  @Expose({ name: '_version' })
  version: number = 2;

  @Expose({ name: 'name' })
  name: string = PLUGIN_NAME;

  @Expose({ name: 'platform' })
  platform: string = PLATFORM_NAME;

  @Expose({ name: 'credentials' })
  @Type(() => GoveeCredentials)
  credentials: GoveeCredentials = new GoveeCredentials();

  @Expose({ name: 'controlChannels' })
  @Type(() => ControlChannels)
  controlChannels: ControlChannels = new ControlChannels();

  @Expose({ name: 'devices' })
  @Type(() => DeviceConfig, {
    discriminator: {
      property: '_type',
      subTypes: [
        { name: 'rgbic', value: RGBICLightDeviceConfig },
        { name: 'rgb', value: RGBLightDeviceConfig },
        { name: 'device', value: DeviceConfig },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  deviceConfigs: DeviceConfig[] = [];

  get isValid(): boolean {
    return ![
      this.credentials.username,
      this.credentials.password,
      this.controlChannels.ble,
      this.controlChannels.iot,
    ].includes(undefined);
  }
}

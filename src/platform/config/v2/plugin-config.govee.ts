import { Expose, Type } from 'class-transformer';
import { GoveeCredentials } from './credentials.config';
import { ControlChannels } from './control-channel.config';
import { DeviceConfig } from './devices/device.config';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../../settings';

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
  @Type(() => DeviceConfig)
  devices: DeviceConfig[] = [];
}

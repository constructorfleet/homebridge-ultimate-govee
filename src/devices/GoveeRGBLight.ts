import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {SolidColor} from './states/SolidColor';
import {MusicMode} from './states/MusicMode';
import {GoveeLight} from './GoveeLight';
import {DeviceFactory} from './DeviceFactory';

@DeviceFactory.register()
export class GoveeRGBLight
  extends MusicMode(
    SolidColor(
      GoveeLight,
    ),
  ) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
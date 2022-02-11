import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {SolidColor} from './states/SolidColor';
import {MusicMode} from './states/MusicMode';
import {GoveeWWLight} from './GoveeWWLight';
import {DeviceFactory} from './DeviceFactory';


@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends MusicMode(
    SolidColor(
      GoveeWWLight,
    ),
  ) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
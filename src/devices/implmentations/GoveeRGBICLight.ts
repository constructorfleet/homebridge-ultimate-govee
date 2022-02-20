import {DeviceConfig} from '../../core/structures/devices/DeviceConfig';
import {Modes} from '../states/Modes';
import {SceneMode} from '../states/modes/Scene';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';


@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends Modes(
    SceneMode,
    RGBICMusicMode,
    ColorSegmentsMode,
  )(LightDevice) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
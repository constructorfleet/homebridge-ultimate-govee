import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {SceneMode} from '../states/modes/Scene';


@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends SceneMode(
    RGBICMusicMode(
      ColorSegmentsMode(
        LightDevice,
      ),
    ),
  ) {

  constructor(args) {
    super(args);
  }
}
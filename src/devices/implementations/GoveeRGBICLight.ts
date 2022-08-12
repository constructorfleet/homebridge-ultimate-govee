import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';
import {ColorMode} from '../states/modes/Color';
import {SceneMode} from '../states/modes/Scene';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {ColorSegmentsMode} from '../states/modes/ColorSegments';

@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends SceneMode(
    RGBICMusicMode(
      ColorSegmentsMode(
        ColorMode(
          LightDevice,
        ),
      ),
    ),
  ) {

  constructor(args) {
    super(args);
  }
}

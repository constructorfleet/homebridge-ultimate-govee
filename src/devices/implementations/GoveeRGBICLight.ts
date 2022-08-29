import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {SceneMode} from '../states/modes/Scene';
import {ColorMode} from '../states/modes/Color';


@DeviceFactory.register(
  'H611A',
  'H6062',
  'H6061',
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
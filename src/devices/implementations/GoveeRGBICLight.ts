import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';


@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends RGBICMusicMode(
    ColorSegmentsMode(
      LightDevice,
    ),
  ) {

  constructor(args) {
    super(args);
  }
}
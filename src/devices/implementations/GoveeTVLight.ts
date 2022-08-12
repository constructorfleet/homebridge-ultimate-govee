import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';


@DeviceFactory.register(
    'H605B',
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

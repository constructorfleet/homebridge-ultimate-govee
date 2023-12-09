import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {DeviceFactory} from '../DeviceFactory';
import {LightDevice} from './GoveeLight';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {SceneMode} from '../states/modes/Scene';
import {ColorMode} from '../states/modes/Color';


@DeviceFactory.register(
  'H611A',
  'H6144',
  'H6072',
  'H705A',
)
export class GoveeRGBICLight
  extends SceneMode(
    RGBICMusicMode(
      ColorSegmentsMode(
        false,
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

@DeviceFactory.register(
  'H6061',
  'H6062',
  'H606A',
)
export class GoveeVariableRGBICLight extends GoveeRGBICLight {
  constructor(args) {
    args.isVariable = true;
    super(args);
  }
}
import {DeviceConfig} from '../../core/structures/devices/DeviceConfig';
import {DeviceFactory} from '../DeviceFactory';
import {Timer} from '../states/Timer';
import {Active} from '../states/Active';
import {OnOff} from '../states/OnOff';
import {GoveeDevice} from '../GoveeDevice';
import {Modes} from '../states/Modes';
import {SceneMode} from '../states/modes/Scene';
import {RGBICMusicMode} from '../states/modes/RGBICMusic';
import {ColorSegmentsMode} from '../states/modes/ColorSegments';
import {Connected} from '../states/Connected';
import {Brightness} from '../states/Brightness';


@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends Modes(
    SceneMode,
    RGBICMusicMode,
    ColorSegmentsMode,
  )(
    Brightness(
      Timer(
        Active(
          OnOff(
            Connected(
              GoveeDevice,
            ),
          ),
        ),
      ),
    ),
  ) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
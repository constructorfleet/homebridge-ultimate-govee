import {DeviceConfig} from '../../core/structures/devices/DeviceConfig';
import {OnOff} from '../states/OnOff';
import {Active} from '../states/Active';
import {Timer} from '../states/Timer';
import {GoveeDevice} from '../GoveeDevice';
import {ColorTemperature} from '../states/ColorTemperature';
import {Brightness} from '../states/Brightness';
import {Modes} from '../states/Modes';
import {SceneMode} from '../states/modes/Scene';

// @DeviceFactory.register()
export class GoveeLight
  extends ColorTemperature(
    Brightness(
      Modes(
        SceneMode,
      )(
        Timer(
          Active(
            OnOff(
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
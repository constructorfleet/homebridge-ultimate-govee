import {DeviceConfig} from '../../core/structures/devices/DeviceConfig';
import {OnOff} from '../states/OnOff';
import {Active} from '../states/Active';
import {Timer} from '../states/Timer';
import {GoveeDevice} from '../GoveeDevice';
import {ColorTemperature} from '../states/ColorTemperature';
import {Brightness} from '../states/Brightness';
import {Connected} from '../states/Connected';


// eslint-disable-next-line @typescript-eslint/no-empty-interface
export class LightDevice extends Timer(
  ColorTemperature(
    Brightness(
      Active(
        Connected(
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

// @DeviceFactory.register()
export class GoveeLight
  extends LightDevice {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
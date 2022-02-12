import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {Active} from './states/Active';
import {Timer} from './states/Timer';
import {GoveeDevice} from './GoveeDevice';
import {StatusMode} from './states/StatusMode';
import {ColorTemperature} from './states/ColorTemperature';
import {Brightness} from './states/Brightness';
import {Scene} from './states/Scene';
import {DeviceFactory} from './DeviceFactory';

@DeviceFactory.register()
export class GoveeLight
  extends Scene(
    ColorTemperature(
      Brightness(
        StatusMode(
          Timer(
            Active(
              OnOff(
                GoveeDevice,
              ),
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
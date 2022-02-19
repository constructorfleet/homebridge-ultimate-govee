import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {FanSpeed} from './states/FanSpeed';
import {Active} from './states/Active';
import {Timer} from './states/Timer';
import {GoveeDevice} from './GoveeDevice';
import {ControlLock} from './states/ControlLock';
import {Connected} from './states/Connected';

@DeviceFactory.register(
  'H7121',
  'H7122',
)
export class GoveeAirPurifier
  extends ControlLock(
    FanSpeed(
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
import {OnOff} from '../states/OnOff';
import {FanSpeed} from '../states/FanSpeed';
import {Active} from '../states/Active';
import {Timer} from '../states/Timer';
import {GoveeDevice} from '../GoveeDevice';
import {ControlLock} from '../states/ControlLock';
import {DeviceFactory} from '../DeviceFactory';

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
                        GoveeDevice,
                    ),
                ),
            ),
        ),
    ) {

  constructor(args) {
    super(args);
  }
}

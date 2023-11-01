import { OnOff } from '../states/OnOff';
import { FanSpeed } from '../states/FanSpeed';
import { Active } from '../states/Active';
import { Timer } from '../states/Timer';
import { GoveeDevice } from '../GoveeDevice';
import { ControlLock } from '../states/ControlLock';
import { DeviceFactory } from '../DeviceFactory';
import { ProgrammableFanSpeed } from '../states/ProgrammableFanSpeed';
import { StatusMode } from '../states/StatusMode';
import { SimpleFanSpeed } from '../states/SimpleFanSpeed';
import { FilterMaintenance } from '../states/FilterMaintenance';

@DeviceFactory.register(
  'H7121',
  'H7122',
)
export class GoveeAirPurifier
  extends ControlLock(
    FanSpeed(
      FilterMaintenance(
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

  constructor(args) {
    super(args);
  }
}

@DeviceFactory.register(
  'H7126',
)
export class GoveeAirPurifierLite
  extends ControlLock(
    ProgrammableFanSpeed(
      SimpleFanSpeed(
        StatusMode(
          FilterMaintenance(
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
    ),
  ) {

  constructor(args) {
    super(args);
  }
}
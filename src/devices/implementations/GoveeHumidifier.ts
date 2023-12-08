import {OnOff} from '../states/OnOff';
import {Active} from '../states/Active';
import {StatusMode} from '../states/StatusMode';
import {MistLevel} from '../states/MistLevel';
import {ProgrammableMistLevel} from '../states/ProgrammableMistLevel';
import {GoveeDevice} from '../GoveeDevice';
import {DeviceFactory} from '../DeviceFactory';

@DeviceFactory.register(
  'H7141',
)
export class GoveeHumidifier
  extends ProgrammableMistLevel(
    MistLevel(
      8,
      StatusMode(
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

@DeviceFactory.register(
  'H7142',
  'H7160',
)
export class GoveeHumidifier6L
  extends ProgrammableMistLevel(
    MistLevel(
      9,
      StatusMode(
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
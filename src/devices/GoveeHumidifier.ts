import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {Active} from './states/Active';
import {StatusMode} from './states/StatusMode';
import {MistLevel} from './states/MistLevel';
import {ProgrammableMistLevel} from './states/ProgrammableMistLevel';
import {GoveeDevice} from './GoveeDevice';
import {ControlLock} from './states/ControlLock';
import {DeviceFactory} from './DeviceFactory';

@DeviceFactory.register(
  'H7141',
  'H7141',
)
export class GoveeHumidifier
  extends ControlLock(ProgrammableMistLevel(MistLevel(StatusMode(Active(OnOff(GoveeDevice)))))) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
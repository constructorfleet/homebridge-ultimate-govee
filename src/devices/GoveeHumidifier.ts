import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {Active} from './states/Active';
import {StatusMode} from './states/StatusMode';
import {MistLevel} from './states/MistLevel';
import {ProgrammableMistLevel} from './states/ProgrammableMistLevel';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {GoveeDevice} from './GoveeDevice';
import {ControlLock} from './states/ControlLock';

export const humidifierProviders: Provider[] = [
  {
    provide: 'H7141',
    useValue: function() {
      return (config) => new GoveeHumidifier(config);
    },
  },
  {
    provide: 'H7142',
    useValue: function() {
      return (config) => new GoveeHumidifier(config);
    },
  },
];

export class GoveeHumidifier
  extends ControlLock(ProgrammableMistLevel(MistLevel(StatusMode(Active(OnOff(GoveeDevice)))))) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
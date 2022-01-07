import {GoveeDevice} from './GoveeDevice';
import {DeviceConfig} from '../core/structures/devices/configs/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {OnOff} from './states/OnOff';
import {Active} from './states/Active';
import {StatusMode} from './states/StatusMode';
import {MistLevel} from './states/MistLevel';
import {ProgrammableMistLevel} from './states/ProgrammableMistLevel';
import {DeviceState} from '../core/structures/devices/DeviceState';

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
  extends ProgrammableMistLevel(MistLevel(StatusMode(Active(OnOff(GoveeDevice))))) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }


  receive(state: DeviceState): void {
    super.receive(state);
    console.log(this);
  }
}
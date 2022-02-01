import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {FanSpeed} from './states/FanSpeed';
import {Active} from './states/Active';
import {Timer} from './states/Timer';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {GoveeDevice} from './GoveeDevice';
import {StatusMode} from './states/StatusMode';
import {ControlLock} from './states/ControlLock';

export const purifierProviders: Provider[] = [
  {
    provide: 'H7121',
    useValue: function() {
      return (config) => new GoveeAirPurifier(config);
    },
  },
  {
    provide: 'H7122',
    useValue: function() {
      return (config) => new GoveeAirPurifier(config);
    },
  },
];

export class GoveeAirPurifier
  extends ControlLock(StatusMode(FanSpeed(Timer(Active(OnOff(GoveeDevice)))))) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
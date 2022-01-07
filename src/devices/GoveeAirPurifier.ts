import {GoveeDevice} from './GoveeDevice';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {OnOff} from './states/OnOff';
import {FanSpeed} from './states/FanSpeed';
import {Active} from './states/Active';
import {Timer} from './states/Timer';
import {DeviceState} from '../core/structures/devices/DeviceState';

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
  extends FanSpeed(Timer(Active(OnOff(GoveeDevice)))) {

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
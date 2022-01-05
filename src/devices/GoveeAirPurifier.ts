import {GoveeDevice} from './GoveeDevice';
import {DeviceConfig} from '../core/events/devices/configs/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';

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
  extends GoveeDevice {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }

  receive(payload: unknown): void {
  }

  send(payload: unknown): void {
  }


}
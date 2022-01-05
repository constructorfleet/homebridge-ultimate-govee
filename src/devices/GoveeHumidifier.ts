import {GoveeDevice} from './GoveeDevice';
import {DeviceConfig} from '../core/events/devices/configs/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';

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
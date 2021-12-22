import {GoveeDevice} from './GoveeDevice';
import {DeviceConfig} from './configs/DeviceConfig';
import {PowerStateConstructor} from './states/PowerState';
import {HumidifierStateConstructor} from './states/HumidifierState';

export class GoveeHumidifier
  extends GoveeDevice {
  static MODELS: string[] = ['H7141', 'H7142'];

  private powerState = new PowerStateConstructor();
  private humidifierState = new HumidifierStateConstructor();

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
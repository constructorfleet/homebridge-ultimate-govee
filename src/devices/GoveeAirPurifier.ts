import {GoveeDevice} from './GoveeDevice';
import {DeviceConfig} from './configs/DeviceConfig';
import {PowerStateConstructor} from './states/PowerState';
import {PurifierFanStateConstructor} from './states/FanModeState';

export class GoveeAirPurifier
  extends GoveeDevice {
  static MODELS: string[] = ['H7121', 'H7122'];

  private powerState = new PowerStateConstructor();
  private fanModeState = new PurifierFanStateConstructor();

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
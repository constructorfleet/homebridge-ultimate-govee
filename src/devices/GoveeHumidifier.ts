import {GoveeDevice, Models} from './GoveeDevice';
import {DeviceConfig} from './configs/DeviceConfig';

@Models(
  'H7141',
  'H7142',
)
export class GoveeHumidifier
  extends GoveeDevice {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
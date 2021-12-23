import {GoveeDevice, Models} from './GoveeDevice';
import {DeviceConfig} from './configs/DeviceConfig';

@Models(
  'H7121',
  'H7122',
)
export class GoveeAirPurifier
  extends GoveeDevice {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
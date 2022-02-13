import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {GoveeLight} from './GoveeLight';
import {DeviceFactory} from './DeviceFactory';
import {ColorSegments} from './states/ColorSegments';


@DeviceFactory.register(
  'H611A',
)
export class GoveeRGBICLight
  extends ColorSegments(
    GoveeLight,
  ) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
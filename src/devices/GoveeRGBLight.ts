import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SolidColor} from './states/SolidColor';
import {GoveeLight} from './GoveeLight';
import {MusicMode} from './states/MusicMode';

const rgbLightModels = [];

export const rgbLightProviders: Provider[] = [];

export class GoveeRGBLight
  extends MusicMode(SolidColor(GoveeLight)) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
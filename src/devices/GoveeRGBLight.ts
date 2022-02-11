import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SolidColor} from './states/SolidColor';
import {MusicMode} from './states/MusicMode';
import {GoveeWWLight} from './GoveeWWLight';

const rgbLightModels = [];

export const rgbLightProviders: Provider[] = rgbLightModels.map(
  (model) => {
    return {
      provide: model,
      useValue: function() {
        return (config) => new GoveeRGBLight(config);
      },
    };
  });

export class GoveeRGBLight
  extends MusicMode(
    SolidColor(
      GoveeWWLight,
    ),
  ) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
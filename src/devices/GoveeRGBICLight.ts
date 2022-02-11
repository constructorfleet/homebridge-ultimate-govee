import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SolidColor} from './states/SolidColor';
import {MusicMode} from './states/MusicMode';
import {GoveeWWLight} from './GoveeWWLight';

const rgbLightModels = [
  'H611A',
];

export const rgbicLightProviders: Provider[] = rgbLightModels.map(
  (model) => {
    return {
      provide: model,
      useValue: function() {
        return (config) => new GoveeRGBICLight(config);
      },
    };
  });

export class GoveeRGBICLight
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
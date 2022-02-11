import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {Active} from './states/Active';
import {Timer} from './states/Timer';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {GoveeDevice} from './GoveeDevice';
import {StatusMode} from './states/StatusMode';
import {ColorTemperature} from './states/ColorTemperature';
import {Brightness} from './states/Brightness';
import {Scene} from './states/Scene';

const wwLightModels = [];

export const wwLightProviders: Provider[] = [];

export class GoveeWWLight
  extends Scene(
    ColorTemperature(
      Brightness(
        StatusMode(
          Timer(
            Active(
              OnOff(
                GoveeDevice,
              ),
            ),
          ),
        ),
      ),
    ),
  ) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
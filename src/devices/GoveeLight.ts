import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {OnOff} from './states/OnOff';
import {Active} from './states/Active';
import {Timer} from './states/Timer';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {GoveeDevice} from './GoveeDevice';
import {StatusMode} from './states/StatusMode';
import {ControlLock} from './states/ControlLock';
import {ColorTemperature} from './states/ColorTemperature';
import {Brightness} from './states/Brightness';
import {Scene} from './states/Scene';

const lightModels = [];

export const lightProviders: Provider[] = [];

export class GoveeLight
  extends Scene(
    ColorTemperature(
      Brightness(
        ControlLock(
          StatusMode(
            Timer(
              Active(
                OnOff(
                  GoveeDevice)))))))) {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super(deviceConfig);
  }
}
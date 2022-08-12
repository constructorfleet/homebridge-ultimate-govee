import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {ColorRGB, rgbToKelvin} from '../../../../util/colorUtils';
import {ColorTemperatureState} from '../../../../devices/states/ColorTemperature';

export class DeviceColorTemperatureTransition extends DeviceTransition<ColorTemperatureState & GoveeDevice> {

  constructor(
    deviceId: string,
    public readonly color: ColorRGB,
    public readonly temperature: number,
  ) {
    super(deviceId);
  }

  protected updateState(device: ColorTemperatureState & GoveeDevice): DeviceColorTemperatureTransition {
    device.colorTemperature = this.color;
    device.temperatureKelvin = rgbToKelvin(this.color);
    this.commandCodes = [device.colorTemperatureChange];
    return this;
  }
}

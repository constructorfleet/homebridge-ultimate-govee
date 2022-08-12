import {DeviceTransition} from '../DeviceTransition';
import {GoveeDevice} from '../../../../devices/GoveeDevice';
import {OnOffState} from '../../../../devices/states/OnOff';

export class DeviceOnOffTransition extends DeviceTransition<OnOffState & GoveeDevice> {

  constructor(
      deviceId: string,
      public readonly on: boolean,
  ) {
    super(deviceId);
  }

  protected updateState(device: OnOffState & GoveeDevice): DeviceOnOffTransition {
    device.isOn = this.on;
    return this;
  }
}

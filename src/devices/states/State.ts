import {DeviceState} from '../../core/structures/devices/DeviceState';

export class State {
  deviceStatusCodes: Set<number[]> = new Set<number[]>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(...args) {

  }

  parse(deviceState: DeviceState): ThisType<this> {
    return this;
  }

  addDeviceStatusCodes(statusCodes: number[]) {
    this.deviceStatusCodes.add(statusCodes);
  }
}
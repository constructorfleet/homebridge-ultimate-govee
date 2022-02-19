import {DeviceState} from '../../../core/structures/devices/DeviceState';

export abstract class DeviceMode {
  abstract modeIdentifier: number;

  public abstract parse(deviceState: DeviceState): ThisType<this>;

  public get commandIdentifiers(): number[] {
    return [5, this.modeIdentifier];
  }
}

import {DeviceState} from '../../../core/structures/devices/DeviceState';

export abstract class DeviceMode {
  modeIdentifier!: number;

  public abstract parse(deviceState: DeviceState): ThisType<this>;
}

import {DeviceConfig} from './configs/DeviceConfig';
import {Constructor} from '../util/types';
import {container} from 'tsyringe';

export function Models<DeviceType extends GoveeDevice>(
  ...models: string[]
): (target: Constructor<DeviceType>) => void {
  console.log(`Models decorator: ${models}`);
  return function(target: Constructor<DeviceType>) {
    models.forEach(
      (model) =>
        container.register(model, target));
    return target;
  };
}

export abstract class GoveeDevice {
  static MODELS: string[] = [];

  protected constructor(
    deviceConfig: DeviceConfig,
  ) {
    this.deviceId = deviceConfig.deviceId;
    this.model = deviceConfig.model;
    this.name = deviceConfig.name;
    this.pactCode = deviceConfig.pactCode;
    this.pactType = deviceConfig.pactType;
    this.hardwareVersion = deviceConfig.hardwareVersion;
    this.softwareVersion = deviceConfig.softwareVersion;
  }

  public deviceId: string;
  public model: string;
  public name: string;
  public pactCode: number;
  public pactType: number;
  public hardwareVersion?: string;
  public softwareVersion?: string;
}
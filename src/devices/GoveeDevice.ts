import {DeviceConfig} from './configs/DeviceConfig';
import {container} from 'tsyringe';
import {constructor} from 'tsyringe/dist/typings/types';

export function Models<DeviceType extends GoveeDevice>(
  ...models: string[]
): (target: constructor<DeviceType>) => void {
  console.log(`Models decorator: ${models}`);
  return function(target: constructor<DeviceType>) {
    models.forEach(
      (model) =>
        container.registerInstance<constructor<DeviceType>>(
          model,
          target,
        ),
    );
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
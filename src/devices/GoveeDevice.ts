import {DeviceConfig} from './configs/DeviceConfig';
import {container} from 'tsyringe';
import {constructor} from 'tsyringe/dist/typings/types';
import {supportsIoT} from './configs/IoTConfig';

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
    console.log(`${this} ${deviceConfig}`);
    this.iotTopic = supportsIoT(deviceConfig)?.deviceTopic ?? undefined;
    this.hardwareVersion = deviceConfig.hardwareVersion;
    this.softwareVersion = deviceConfig.softwareVersion;
  }

  public deviceId: string;
  public model: string;
  public name: string;
  public pactCode: number;
  public pactType: number;
  public iotTopic?: string;
  public hardwareVersion?: string;
  public softwareVersion?: string;

  public abstract send(payload: unknown): void;
  public abstract receive(payload: unknown): void;
}
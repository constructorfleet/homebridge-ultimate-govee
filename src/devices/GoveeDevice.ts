import {DeviceConfig} from './configs/DeviceConfig';

export abstract class GoveeDevice
  implements DeviceConfig {
  static MODELS: string[] = [];

  protected constructor(
    {
      deviceId,
      model,
      name,
      pactCode,
      pactType,
      hardwareVersion,
      softwareVersion,
    }: DeviceConfig,
  ) {
    this.deviceId = deviceId;
    this.model = model;
    this.name = name;
    this.pactCode = pactCode;
    this.pactType = pactType;
    this.hardwareVersion = hardwareVersion;
    this.softwareVersion = softwareVersion;
  }

  public deviceId: string;
  public model: string;
  public name: string;
  public pactCode: number;
  public pactType: number;
  public hardwareVersion?: string;
  public softwareVersion?: string;
}
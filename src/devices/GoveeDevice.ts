import {State} from './states/State';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {supportsIoT} from '../core/structures/devices/configs/IoTConfig';
import {DeviceState} from '../core/structures/devices/DeviceState';

export class GoveeDevice extends State {
  static MODELS: string[] = [];

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super();
    this.deviceId = deviceConfig.deviceId;
    this.model = deviceConfig.model;
    this.name = deviceConfig.name;
    this.pactCode = deviceConfig.pactCode;
    this.pactType = deviceConfig.pactType;
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

  public send(state: DeviceState): void {
  }

  public receive(state: DeviceState) {
    this.parse(state);
  }
}
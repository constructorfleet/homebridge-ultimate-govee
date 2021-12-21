export interface DeviceConfig {
  deviceId: string;

  name: string;

  model: string;

  pactType: number;

  pactCode: number;

  hardwareVersion?: string;

  softwareVersion?: string;
}
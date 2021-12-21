export interface WiFiConfig
  extends ConnectionConfig {
  ssid: string;

  macAddress: string;

  wifiSoftwareVersion?: string;

  wifiHardwareVersion?: string;
}
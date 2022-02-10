export interface WiFiConfig
  extends ConnectionConfig {
  ssid?: string;

  macAddress?: string;

  wifiSoftwareVersion?: string;

  wifiHardwareVersion?: string;
}

export const supportsBLE = (arg): WiFiConfig | undefined => {
  return Reflect.has(arg, 'macAddress') && arg.macAddress
    ? arg as WiFiConfig
    : undefined;
};
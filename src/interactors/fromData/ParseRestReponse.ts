import {AppDeviceSettingsResponse} from '../../data/structures/api/responses/payloads/AppDeviceListResponse';
import {DeviceConfig} from '../../devices/configs/DeviceConfig';
import {set} from 'rambda';

export function parseRestResponse(
  settings: AppDeviceSettingsResponse,
): DeviceConfig {
  return {
    deviceId: settings.deviceId,
    name: settings.deviceName,
    model: settings.deviceModel,
    pactType: settings.pactType,
    pactCode: settings.pactCode,
    hardwareVersion: settings.hardwareVersion,
    softwareVersion: settings.softwareVersion,
    deviceTopic: settings?.iotDeviceTopic,
    bleName: settings?.bleName,
    bleAddress: settings?.address,
    ssid: settings?.wifiSSID,
    wifiHardwareVersion: settings?.wifiHardwareVersion,
    wifiSoftwareVersion: settings?.wifiSoftwareVersion,
    macAddress: settings?.wifiMACAddress,
  };
}
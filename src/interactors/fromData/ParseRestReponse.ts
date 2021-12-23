import {AppDeviceSettingsResponse} from '../../data/structures/api/responses/payloads/AppDeviceListResponse';
import {DeviceConfig} from '../../devices/configs/DeviceConfig';

export function parseRestResponse(
  settings: AppDeviceSettingsResponse,
): DeviceConfig {
  const connections: ConnectionConfig[] = [];
  if (settings.bleName && settings.address) {
    connections.push({
      bleName: settings.bleName,
      bleAddress: settings.address,
    });
  }

  if (settings.iotDeviceTopic) {
    connections.push({
      iotTopic: settings.iotDeviceTopic,
    });
  }
  return {
    deviceId: settings.deviceId,
    name: settings.deviceName,
    model: settings.deviceModel,
    pactType: settings.pactType,
    pactCode: settings.pactCode,
    hardwareVersion: settings.hardwareVersion,
    softwareVersion: settings.softwareVersion,
    connections: connections,
  };
}
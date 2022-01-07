import {AppDeviceListResponse, AppDeviceSettingsResponse} from '../data/structures/api/responses/payloads/AppDeviceListResponse';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {Injectable} from '@nestjs/common';
import {Emitter} from '../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {plainToInstance} from 'class-transformer';
import {DeviceSettingsReceived} from '../core/events/devices/DeviceReceived';

@Injectable()
export class RestPayloadProcessor extends Emitter {
  constructor(
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'REST.RESPONSE.DeviceList',
    {
      async: true,
    },
  )
  onDeviceListReceived(payload: AppDeviceListResponse) {
    payload.devices
      .map(
        (device) =>
          plainToInstance(
            AppDeviceSettingsResponse,
            JSON.parse(device.deviceExt.deviceSettings),
          ) as AppDeviceSettingsResponse,
      )
      .map(toDeviceConfig)
      .forEach((device) =>
        this.emit(
          new DeviceSettingsReceived(device),
        ),
      );
  }
}

export function toDeviceConfig(
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
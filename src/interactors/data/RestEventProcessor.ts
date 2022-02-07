import {AppDeviceListResponse, AppDeviceSettingsResponse} from '../../core/structures/api/responses/payloads/AppDeviceListResponse';
import {DeviceConfig} from '../../core/structures/devices/DeviceConfig';
import {Injectable} from '@nestjs/common';
import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {plainToInstance} from 'class-transformer';
import {DeviceSettingsReceived} from '../../core/events/devices/DeviceReceived';
import {ApiResponseStatus} from '../../core/structures/api/ApiResponseStatus';
import {LoggingService} from '../../logging/LoggingService';
import {RestAuthenticateEvent} from '../../core/events/dataClients/rest/RestAuthentication';

@Injectable()
export class RestEventProcessor extends Emitter {
  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'REST.AUTHENTICATION.Failure',
    {
      async: true,
    },
  )
  onAuthenticationFailure(response: ApiResponseStatus) {
    this.log.error('Unexpected error authenticating with API', response.message);
    if (response.statusCode >= 500) {
      this.log.error('Retrying authentication in 1 minute due to server-side error.');
      setTimeout(
        () => this.emit(new RestAuthenticateEvent()),
        60 * 1000,
      );
    } else if (response.statusCode >= 400) {
      this.log.error('Please verify your API credentials and restart the plugin.');
    }
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
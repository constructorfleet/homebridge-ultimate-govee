import {
  AppDeviceListResponse,
  AppDeviceResponse,
  AppDeviceSettingsResponse,
} from '../../core/structures/api/responses/payloads/AppDeviceListResponse';
import { DeviceConfig } from '../../core/structures/devices/DeviceConfig';
import { Injectable } from '@nestjs/common';
import { Emitter } from '../../util/types';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { DeviceSettingsReceived } from '../../core/events/devices/DeviceReceived';
import { ApiResponseStatus } from '../../core/structures/api/ApiResponseStatus';
import { LoggingService } from '../../logging/LoggingService';
import { RestAuthenticateEvent } from '../../core/events/dataClients/rest/RestAuthentication';
import { DIYEffect, DIYGroup, DIYListResponse } from '../../core/structures/api/responses/payloads/DIYListResponse';
import {
  CategoryScene,
  DeviceSceneCategory,
  DeviceSceneListResponse,
} from '../../core/structures/api/responses/payloads/DeviceSceneListResponse';
import { ResponseWithDevice } from '../../core/events/dataClients/rest/RestResponse';
import { DIYEffectReceived } from '../../core/events/effects/DIYEffects';
import { DeviceEffectReceived } from '../../core/events/effects/DeviceEffects';
import console from 'console';
import { IoTSubscribeToEvent } from '../../core/events/dataClients/iot/IotSubscription';


@Injectable()
export class RestEventProcessor extends Emitter {
  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'REST.AUTHENTICATION.Failure', {
    async: true,
    nextTick: true,
  },
  )
  async onAuthenticationFailure(response: ApiResponseStatus) {
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
    'REST.RESPONSE.DIYEffects', {
    async: true,
    nextTick: true,
  },
  )
  async onDIYEffectListReceived(
    payload: DIYListResponse,
  ) {
    const effects = payload.data?.diys
      ?.filter(
        (group: DIYGroup) => group.diys !== undefined && Symbol.iterator in Object(group),
      )
      ?.reduce(
        (effects: DIYEffect[], group: DIYGroup) => effects
          .concat(
            ...group.diys,
          ),
        [] as DIYEffect[],
      );

    if (!effects) {
      return;
    }

    await this.emitAsync(
      new DIYEffectReceived(effects),
    );
  }

  @OnEvent(
    'REST.RESPONSE.DeviceScenes', {
    async: true,
    nextTick: true,
  },
  )
  async onDeviceScenesReceived(
    payload: ResponseWithDevice<DeviceSceneListResponse>,
  ) {
    const effects = payload.response.data.categories
      .filter(
        (category: DeviceSceneCategory) => category.scenes !== undefined && Symbol.iterator in Object(category.scenes),
      )
      .reduce(
        (effects: CategoryScene[], category: DeviceSceneCategory) => effects
          .concat(
            ...category.scenes
              .filter(
                (scene: CategoryScene) => scene !== undefined,
              )
              .map(
                (scene: CategoryScene) => {
                  scene.deviceId = payload.device.deviceId;
                  return scene;
                },
              ),
          ),
        [] as CategoryScene[],
      );

    await this.emitAsync(
      new DeviceEffectReceived(effects),
    );

  }

  @OnEvent(
    'REST.RESPONSE.DeviceList', {
    async: true,
    nextTick: true,
  },
  )
  async onDeviceListReceived(payload: AppDeviceListResponse) {
    const deviceConfigs = await Promise.all(payload.devices
      .map(
        async (device) =>
          this.toDeviceConfig(
            plainToInstance(
              AppDeviceSettingsResponse,
              JSON.parse(device.deviceExt.deviceSettings),
            ) as AppDeviceSettingsResponse,
            device,
          ),
      )
    );

    for (let i = 0; i < deviceConfigs.length; i++) {
      await this.emitAsync(
        new DeviceSettingsReceived(deviceConfigs[ i ]),
      );
    }
  }

  async toDeviceConfig(
    settings: AppDeviceSettingsResponse,
    device: AppDeviceResponse,
  ): Promise<DeviceConfig> {
    if (settings.iotDeviceTopic) {
      console.dir(settings);
      console.dir(device);
      await this.emitAsync(
        new IoTSubscribeToEvent(
          settings.iotDeviceTopic
        )
      );
    }
    return {
      deviceId: settings.deviceId,
      name: settings.deviceName,
      model: settings.deviceModel,
      pactType: settings.pactType,
      pactCode: settings.pactCode,
      goodsType: device.goodsType,
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
}
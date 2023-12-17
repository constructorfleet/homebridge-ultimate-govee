import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Emitter } from '../util/types';
import { ModuleRef } from '@nestjs/core';
import { DeviceState } from '../core/structures/devices/DeviceState';
import { DeviceConfig } from '../core/structures/devices/DeviceConfig';
import { DevicePollRequest, DeviceStateRequest } from '../core/events/devices/DeviceRequests';
import { GoveeDevice } from './GoveeDevice';
import { DeviceDiscoveredEvent } from '../core/events/devices/DeviceDiscovered';
import { DeviceUpdatedEvent } from '../core/events/devices/DeviceUpdated';
import { DeviceTransition } from '../core/structures/devices/DeviceTransition';
import { LoggingService } from '../logging/LoggingService';
import { PersistService } from '../persist/PersistService';
import { RestRequestDeviceScenes, RestRequestDIYEffects } from '../core/events/dataClients/rest/RestRequest';
import { DeviceRefreshData } from '../core/events/devices/DeviceRefresh';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { IoTSubscribeToEvent } from '../core/events/dataClients/iot/IotSubscription';


@Injectable()
export class DeviceManager extends Emitter {
  private readonly devices = new Map<string, GoveeDevice>();

  constructor(
    eventEmitter: EventEmitter2,
    private persist: PersistService,
    private readonly log: LoggingService,
    public moduleRef: ModuleRef,
  ) {
    super(eventEmitter);
  }

  static async recordUnknownDevice(deviceId: string, model: string, data: unknown) {
    const deviceLogDir = `/homebridge/logs/devices/${ model }`;
    if (!existsSync(deviceLogDir)) {
      await mkdir(deviceLogDir, { recursive: true });
    }
    await writeFile(
      `${ deviceLogDir }/${ deviceId }`,
      JSON.stringify(data, null, 2),
      { encoding: 'utf-8' }
    );
  }

  @OnEvent(
    'DEVICE.RECEIVED.Settings', {
    async: true,
    nextTick: true,
  }
  )
  async onDeviceSetting(deviceSettings: DeviceConfig) {
    if (!deviceSettings) {
      this.log.info('No device settings');
      return;
    }

    if (deviceSettings.deviceId === "5F:D3:7C:A6:B0:4A:17:8C" && deviceSettings.deviceTopic !== undefined) {
      await this.emitAsync(
        new IoTSubscribeToEvent(
          deviceSettings.deviceTopic
        )
      );
    }

    const newDevice = !this.devices.has(deviceSettings.deviceId);
    let deviceCtor;
    try {
      // @ts-ignore
      deviceCtor = this.moduleRef.get(deviceSettings.model)();
    } catch (error) {
      this.log.info(
        'DeviceManager',
        'onDeviceSettings',
        'Unknown model',
        deviceSettings.model,
      );
      await DeviceManager.recordUnknownDevice(
        deviceSettings.deviceId,
        deviceSettings.model,
        deviceSettings);
      return;
    }

    try {
      const device = deviceCtor(deviceSettings);
      this.devices.set(
        deviceSettings.deviceId,
        device,
      );
      await this.emitAsync(
        new DeviceDiscoveredEvent(device),
      );
      await this.emitAsync(
        new RestRequestDeviceScenes(device),
      );
      await this.emitAsync(
        new RestRequestDIYEffects(),
      );
      if (newDevice) {
        await this.emitAsync(
          new DevicePollRequest(device.deviceId),
        );
      }
    } catch (err) {
      this.log.error(err);
    }
  }

  @OnEvent(
    'DEVICE.RECEIVED.State', {
    async: true,
    nextTick: true,
  }
  )
  async onDeviceState(deviceState: DeviceState) {
    if (!this.devices.has(deviceState.deviceId)) {
      this.log.info(
        'DeviceManager',
        'onDeviceState',
        'Unknown Device',
        deviceState.deviceId,
      );
      await DeviceManager.recordUnknownDevice(deviceState.deviceId, deviceState.model || "unknown", deviceState);
      return;
    }
    const device = this.devices.get(deviceState.deviceId);
    if (device) {
      device.updateState(deviceState);
      await this.emitAsync(
        new DeviceUpdatedEvent(device),
      );
    }
  }

  @OnEvent(
    'DEVICE.Command', {
    async: true,
    nextTick: true,
  }
  )
  async onDeviceCommand(deviceTransition: DeviceTransition<GoveeDevice>) {
    const device = this.devices.get(deviceTransition.deviceId);
    if (!device) {
      this.log.info(
        'DeviceManager',
        'onDeviceCommand',
        'Unknown Device',
        deviceTransition.deviceId,
      );
      return;
    }
    const accountTopic = this.persist.oauthData?.accountIoTTopic;
    deviceTransition.apply(
      device,
      this,
      accountTopic,
    );
  }

  @OnEvent(
    'DEVICE.REQUEST.Poll', {
    async: true,
    nextTick: true,
  }
  )
  async pollDeviceStates(
    deviceId: string,
  ) {
    const device = this.devices.get(deviceId);
    if (device) {
      await this.emitAsync(
        new DeviceStateRequest(device),
      );
    }
    setTimeout(
      () => this.emit(
        new DevicePollRequest(deviceId),
      ),
      30 * 1000,
    );
  }

  @OnEvent(
    'DEVICE.Refresh', {
    async: true,
    nextTick: true,
  }
  )
  async refreshDevice(
    data: DeviceRefreshData
  ) {
    const device = this.devices.get(data.deviceId);
    if (device) {
      await this.emitAsync(
        new DeviceUpdatedEvent(device),
      );
    }
  }
}
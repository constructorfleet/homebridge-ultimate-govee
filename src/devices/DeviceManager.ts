import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {Emitter} from '../util/types';
import {ModuleRef} from '@nestjs/core';
import {DeviceState} from '../core/structures/devices/DeviceState';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {DevicePollRequest, DeviceStateRequest} from '../core/events/devices/DeviceRequests';
import {GoveeDevice} from './GoveeDevice';
import {DeviceDiscoveredEvent} from '../core/events/devices/DeviceDiscovered';
import {DeviceUpdatedEvent} from '../core/events/devices/DeviceUpdated';
import {DeviceTransition} from '../core/structures/devices/DeviceTransition';
import {LoggingService} from '../logging/LoggingService';
import {PersistService} from '../persist/PersistService';
import {RestRequestDeviceScenes, RestRequestDIYEffects} from '../core/events/dataClients/rest/RestRequest';


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

  @OnEvent(
      'DEVICE.RECEIVED.Settings',
  )
  async onDeviceSetting(deviceSettings: DeviceConfig) {
    if (!deviceSettings) {
      this.log.info('No device settings');
      return;
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
      'DEVICE.RECEIVED.State',
  )
  async onDeviceState(deviceState: DeviceState) {
    if (!this.devices.has(deviceState.deviceId)) {
      this.log.info(
          'DeviceManager',
          'onDeviceState',
          'Unknown Device',
          deviceState.deviceId,
      );
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
      'DEVICE.Command',
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
      'DEVICE.REQUEST.Poll',
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
}

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


@Injectable()
export class DeviceManager extends Emitter {
  private readonly devices = new Map<string, GoveeDevice>();

  constructor(
    eventEmitter: EventEmitter2,
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
    if (!this.devices.has(deviceSettings.deviceId)) {
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
          new DevicePollRequest(device),
        );
      } catch (err) {
        this.log.error(err);
      }
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
    if (!device.iotTopic) {
      return;
    }
    deviceTransition.apply(
      device,
      this,
    );
  }

  @OnEvent(
    'DEVICE.REQUEST.Poll',
  )
  async pollDeviceStates(
    device: GoveeDevice,
  ) {
    this.log.debug(
      'DeviceManager',
      'pollDeviceStates',
      device.deviceId,
    );
    await this.emitAsync(
      new DeviceStateRequest(device),
    );

    this.log.debug(
      'DeviceManager',
      'pollDeviceStates',
      'Setting Poll Timeout',
      device.deviceId,
    );
    setTimeout(
      () => this.emit(
        new DevicePollRequest(device),
      ),
      30 * 1000,
    );
  }
}
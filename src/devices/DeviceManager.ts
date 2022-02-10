import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {Emitter, sleep} from '../util/types';
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
    this.emit(
      new DevicePollRequest(),
    );
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
      try {
        // @ts-ignore
        const deviceCtor = this.moduleRef.get(deviceSettings.model)();
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
      this.log.info('Unknown Device');
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
      this.log.info('Unknown Device');
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
    {
      nextTick: true,
    },
  )
  async pollDeviceStates(
    device?: GoveeDevice,
  ) {
    const devices = device ? [device] : Array.from(this.devices.values());
    for (let i = 0; i < devices.length; i++) {
      await this.emitAsync(
        new DeviceStateRequest(devices[i]),
      );
    }

    if (!device) {
      this.log.debug('Setting timeout');
      await sleep(1000);
      await this.emitAsync(
        new DevicePollRequest(),
      );
    }
  }
}
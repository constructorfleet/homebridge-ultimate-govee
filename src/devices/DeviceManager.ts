import {GoveeHumidifier} from './GoveeHumidifier';
import {GoveeAirPurifier} from './GoveeAirPurifier';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {Emitter} from '../util/types';
import {ModuleRef} from '@nestjs/core';
import {DeviceState} from '../core/structures/devices/DeviceState';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {DeviceStateRequest} from '../core/events/devices/DeviceRequests';
import {GoveeDevice} from './GoveeDevice';


@Injectable()
export class DeviceManager extends Emitter {
  private static readonly DEVICE_CLASSES = [
    GoveeHumidifier,
    GoveeAirPurifier,
  ];

  private readonly devices = new Map<string, GoveeDevice>();

  constructor(
    eventEmitter: EventEmitter2,
    public moduleRef: ModuleRef,
  ) {
    super(eventEmitter);
  }

  get knownDevices(): GoveeDevice[] {
    return Array.from(this.devices.values());
  }

  @OnEvent('DEVICE.RECEIVED.Settings')
  onDeviceSetting(deviceSettings: DeviceConfig) {
    if (!deviceSettings) {
      console.log('No device settings');
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

        this.pollDeviceStates(
          device,
        );
      } catch (err) {
        console.log(err);
      }
    }
  }

  @OnEvent('DEVICE.RECEIVED.State')
  onDeviceState(deviceState: DeviceState) {
    if (!this.devices.has(deviceState.deviceId)) {
      console.log('Unknown Device');
    }
    this.devices.get(deviceState.deviceId)?.receive(deviceState);
    return;
  }

  pollDeviceStates = (
    device?: GoveeDevice,
  ): void => {
    console.log(
      `POLLING STATE ${device?.deviceId} ${device?.iotTopic} ${JSON.stringify(this.devices)}`);
    (
      device
        ? [device]
        : Array.from(this.devices.values())
    )
      ?.forEach(
        (device) => {
          this.emit(
            new DeviceStateRequest(device),
          );
          if (!device) {
            console.log('Setting timeout');
            setTimeout(
              () => this.pollDeviceStates,
              10 * 1000,
            );
          }
        },
      );
  };
}
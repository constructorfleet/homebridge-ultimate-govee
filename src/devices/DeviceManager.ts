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
import {DeviceDiscoveredEvent} from '../core/events/devices/DeviceDiscovered';
import {DeviceUpdatedEvent} from '../core/events/devices/DeviceUpdated';
import {DeviceActiveTransition} from '../core/structures/devices/transitions/DeviceActiveTransition';
import {DeviceFanSpeedTransition} from '../core/structures/devices/transitions/DeviceFanSpeedTransition';
import {DeviceMistLevelTransition} from '../core/structures/devices/transitions/DeviceMistLevelTransition';
import {DeviceOnOffTransition} from '../core/structures/devices/transitions/DeviceOnOffTransition';
import {FanSpeedState} from './states/FanSpeed';
import {IoTPublishTo} from '../core/events/dataClients/iot/IoTPublish';
import {hexToBase64} from '../util/encodingUtils';
import {MistLevelState} from './states/MistLevel';
import {ActiveState} from './states/Active';


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
        this.emit(
          new DeviceDiscoveredEvent(device),
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
      return;
    }
    const device = this.devices.get(deviceState.deviceId);
    if (device) {
      device.updateState(deviceState);
      this.emit(
        new DeviceUpdatedEvent(device),
      );
    }
    return;
  }

  @OnEvent('DEVICE.Command')
  onDeviceCommand(deviceTransition: DeviceActiveTransition | DeviceFanSpeedTransition | DeviceMistLevelTransition | DeviceOnOffTransition) {
    const device = this.devices.get(deviceTransition.deviceId);
    if (!device) {
      console.log('Unknown Device');
      return;
    }
    if (!device.iotTopic) {
      return;
    }
    if (Reflect.has(deviceTransition, 'fanSpeed')) {
      (device as unknown as FanSpeedState).fanSpeed = (deviceTransition as DeviceFanSpeedTransition).fanSpeed;
      device.send(
        hexToBase64((device as unknown as FanSpeedState).fanSpeedChange.command ?? []),
        this,
      );
      // this.emit(
      //   new IoTPublishTo(
      //     device.iotTopic,
      //     JSON.stringify({
      //       topic: device.iotTopic,
      //       msg: {
      //         device: device.deviceId,
      //         cmd: 'ptReal',
      //         cmdVersion: 0,
      //         transaction: `u_${Date.now()}`,
      //         type: 1,
      //         data: {
      //           command: [
      //             hexToBase64((device as unknown as FanSpeedState).fanSpeedChange.command ?? []),
      //           ],
      //         },
      //       },
      //     }),
      //   ),
      // );
    }
    if (Reflect.has(deviceTransition, 'mistLevel')) {
      (device as unknown as MistLevelState).mistLevel = (deviceTransition as DeviceMistLevelTransition).mistLevel;
      device.send(
        hexToBase64((device as unknown as MistLevelState).mistLevelChange.command ?? []),
        this,
      );
      // this.emit(
      //   new IoTPublishTo(
      //     device.iotTopic,
      //     JSON.stringify({
      //       topic: device.iotTopic,
      //       msg: {
      //         device: device.deviceId,
      //         cmd: 'ptReal',
      //         cmdVersion: 0,
      //         transaction: `u_${Date.now()}`,
      //         type: 1,
      //         data: {
      //           command: [
      //             hexToBase64((device as unknown as MistLevelState).mistLevelChange.command ?? []),
      //           ],
      //         },
      //       },
      //     }),
      //   ),
      // );
    }
    if (Reflect.has(deviceTransition, 'active')) {
      (device as unknown as ActiveState).isActive = (deviceTransition as DeviceActiveTransition).active;
      device.send(
        hexToBase64((device as unknown as ActiveState).activeStateChange.command ?? []),
        this,
      );
      // this.emit(
      //   new IoTPublishTo(
      //     device.iotTopic,
      //     JSON.stringify({
      //       topic: device.iotTopic,
      //       msg: {
      //         device: device.deviceId,
      //         cmd: 'ptReal',
      //         cmdVersion: 0,
      //         transaction: `u_${Date.now()}`,
      //         type: 1,
      //         data: {
      //           command: [
      //             hexToBase64((device as unknown as ActiveState).activeStateChange.command ?? []),
      //           ],
      //         },
      //       },
      //     }),
      //   ),
      // );
    }
  }

  pollDeviceStates = (
    device?: GoveeDevice,
  ): void => {
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
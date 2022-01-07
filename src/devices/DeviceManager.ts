import {GoveeDevice} from './GoveeDevice';
import {GoveeHumidifier} from './GoveeHumidifier';
import {GoveeAirPurifier} from './GoveeAirPurifier';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {Emitter} from '../util/types';
import {IoTPublishTo} from '../core/events/dataClients/iot/IoTPublish';
import {AppDeviceSettingsResponse} from '../data/structures/api/responses/payloads/AppDeviceListResponse';
import {ModuleRef} from '@nestjs/core';
import {DeviceState} from '../core/structures/devices/DeviceState';
import {configFromRESTResponse} from '../interactors/fromData/ParseRestReponse';


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
  onDeviceSetting(deviceSettings: AppDeviceSettingsResponse) {
    if (!deviceSettings) {
      console.log('No device settings');
      return;
    }
    if (!this.devices.has(deviceSettings.deviceId)) {
      try {
        // @ts-ignore
        const deviceCtor = this.moduleRef.get(deviceSettings.deviceModel)();
        const device = deviceCtor(configFromRESTResponse(deviceSettings));
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
          if (!device.iotTopic) {
            return;
          }
          this.emit(
            new IoTPublishTo(
              device.iotTopic,
              JSON.stringify({
                topic: device.iotTopic,
                msg: {
                  cmd: 'status',
                  cmdVersion: 2,
                  transaction: `u_${Date.now()}`,
                  type: 0,
                },
              }),
            ),
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
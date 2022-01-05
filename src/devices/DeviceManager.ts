import {GoveeDevice} from './GoveeDevice';
import {GoveeHumidifier} from './GoveeHumidifier';
import {GoveeAirPurifier} from './GoveeAirPurifier';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {DeviceStateReceived} from '../core/events/devices/DeviceReceived';
import {Emitter} from '../util/types';
import {IoTPublishTo} from '../core/events/dataClients/iot/IoTPublish';
import {AppDeviceData, AppDeviceSettingsResponse} from '../data/structures/api/responses/payloads/AppDeviceListResponse';
import {parseRestResponse} from '../interactors/fromData/ParseRestReponse';
import {ModuleRef} from '@nestjs/core';


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
        const device = deviceCtor(parseRestResponse(deviceSettings));
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
  onDeviceState(deviceState) {
    console.log(deviceState);
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
          console.log(device);
          if (!device.iotTopic) {
            return;
          }
          console.log(`publishing device message to ${device.iotTopic}`);
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
import {container} from 'tsyringe';
import {constructor} from 'tsyringe/dist/typings/types';
import {GoveeDevice} from './GoveeDevice';
import {GoveeHumidifier} from './GoveeHumidifier';
import {GoveeAirPurifier} from './GoveeAirPurifier';
import {DEVICE_SETTINGS_EVENT, DEVICE_STATE_EVENT} from '../util/const';
import {AppDeviceSettingsResponse} from '../data/structures/api/responses/payloads/AppDeviceListResponse';
import {parseRestResponse} from '../interactors/fromData/ParseRestReponse';
import {IoTAccountMessage} from '../data/structures/iot/IoTAccountMessage';
import {parseIoTResponse} from '../interactors/fromData/ParseIoTResponse';
import {EventEmitter} from 'events';

export class DeviceManager {
  private static readonly DEVICE_CLASSES = [
    GoveeHumidifier,
    GoveeAirPurifier,
  ];

  public static readonly INSTANCE: DeviceManager = new DeviceManager();
  private static readonly devices = new Map<string, GoveeDevice>();

  private constructor() {
    container.registerInstance(
      `${DEVICE_SETTINGS_EVENT}_Handler`,
      this.onDeviceSetting,
    );
    if (container.isRegistered(`${DEVICE_SETTINGS_EVENT}_Emitter`)) {
      container.resolveAll<EventEmitter>(
        `${DEVICE_SETTINGS_EVENT}_Emitter`,
      )
        .forEach((emitter) =>
          emitter.listeners(DEVICE_SETTINGS_EVENT)
            .includes(this.onDeviceSetting)
            || emitter.on(
              DEVICE_SETTINGS_EVENT,
              this.onDeviceSetting,
            ),
        );
    }
    container.registerInstance(
      `${DEVICE_STATE_EVENT}_Handler`,
      this.onDeviceState,
    );
    if (container.isRegistered(`${DEVICE_STATE_EVENT}_Emitter`)) {
      container.resolveAll<EventEmitter>(
        `${DEVICE_STATE_EVENT}_Emitter`,
      )
        .forEach((emitter) =>
          emitter.listeners(DEVICE_STATE_EVENT)
            .includes(this.onDeviceState)
            || emitter.on(
              DEVICE_STATE_EVENT,
              this.onDeviceState,
            ),
        );
    }
  }

  onDeviceSetting(deviceSettings: AppDeviceSettingsResponse) {
    if (!DeviceManager.devices.has(deviceSettings.deviceId)) {
      if (container.isRegistered(deviceSettings.deviceModel)) {
        const ctor = container.resolve<constructor<GoveeDevice>>(
          deviceSettings.deviceModel,
        );

        DeviceManager.devices.set(
          deviceSettings.deviceId,
          new ctor(parseRestResponse(deviceSettings)),
        );
      }
    }
  }

  onDeviceState(deviceState: IoTAccountMessage) {
    if (!DeviceManager.devices.has(deviceState.deviceId)) {
      return;
    }

    console.log(parseIoTResponse(deviceState));
  }
}
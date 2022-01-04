import {autoInjectable, container, inject, singleton} from 'tsyringe';
import {constructor} from 'tsyringe/dist/typings/types';
import {GoveeDevice} from './GoveeDevice';
import {GoveeHumidifier} from './GoveeHumidifier';
import {GoveeAirPurifier} from './GoveeAirPurifier';
import {
  DEVICE_SETTINGS_EVENT,
  DEVICE_STATE_EVENT,
  IOT_CLIENT_CREATED,
  IOT_CONNECTED_EVENT,
  IOT_PUBLISH_EVENT,
} from '../util/const';
import {AppDeviceSettingsResponse} from '../data/structures/api/responses/payloads/AppDeviceListResponse';
import {parseRestResponse} from '../interactors/fromData/ParseRestReponse';
import {IoTAccountMessage} from '../data/structures/iot/IoTAccountMessage';
import {parseIoTResponse} from '../interactors/fromData/ParseIoTResponse';
import {EventEmitter} from 'events';
import {plainToInstance} from 'class-transformer';
import {IotDeviceMessageEnvelope} from '../data/structures/iot/IotDeviceMessageEnvelope';
import {RestClient} from '../data/clients/RestClient';
import {IoTClient} from '../data/clients/IoTClient';
import {Emits, EventHandler, Handles} from '../core/events';

@singleton()
@Emits(
  IOT_PUBLISH_EVENT,
  IOT_CLIENT_CREATED,
  IOT_CONNECTED_EVENT,
  DEVICE_SETTINGS_EVENT,
  DEVICE_STATE_EVENT,
)
@EventHandler()
@autoInjectable()
export class DeviceManager
  extends EventEmitter {
  private static readonly DEVICE_CLASSES = [
    GoveeHumidifier,
    GoveeAirPurifier,
  ];

  private readonly devices = new Map<string, GoveeDevice>();

  constructor(
    @inject(RestClient) private readonly restClient: RestClient,
    @inject(IoTClient) private readonly iotClient: IoTClient,
  ) {
    super();
    console.log('DeviceManager const');
  }

  get knownDevices(): GoveeDevice[] {
    return Array.from(this.devices.values());
  }

  @Handles(DEVICE_SETTINGS_EVENT)
  onDeviceSetting(deviceSettings: AppDeviceSettingsResponse): void {
    if (!this.devices.has(deviceSettings.deviceId)) {
      if (container.isRegistered(deviceSettings.deviceModel)) {
        const ctor = container.resolve<constructor<GoveeDevice>>(
          deviceSettings.deviceModel,
        );

        const device = new ctor(parseRestResponse(deviceSettings));
        this.devices.set(
          deviceSettings.deviceId,
          device,
        );

        this.pollDeviceStates(
          device,
        );
      }
    }
  };

  @Handles(DEVICE_STATE_EVENT)
  onDeviceState = (deviceState: IoTAccountMessage): void => {
    console.log(deviceState);
    if (!this.devices.has(deviceState.deviceId)) {
      return;
    }

    console.log(parseIoTResponse(deviceState));
  };

  pollDeviceStates = (
    device?: GoveeDevice,
  ): void => {
    console.log(
      `POLLING STATE ${device?.deviceId} ${device?.iotTopic} ${JSON.stringify(this.devices)}`);
    (
      device
        ? [device]
        : Array.from(this.devices)
    )
      ?.forEach(
        (device) => {
          console.log(device);
          if (!device.iotTopic) {
            return;
          }
          console.log(`publishing device message to ${device.iotTopic}`);
          this.emit(
            IOT_PUBLISH_EVENT,
            plainToInstance(
              IotDeviceMessageEnvelope,
              {
                topic: device.iotTopic,
                msg: {
                  cmd: 'status',
                  cmdVersion: 2,
                  transaction: `u_${Date.now()}`,
                  type: 0,
                },
              },
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
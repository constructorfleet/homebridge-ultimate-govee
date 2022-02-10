import {State} from './states/State';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {supportsIoT} from '../core/structures/devices/configs/IoTConfig';
import {DeviceState} from '../core/structures/devices/DeviceState';
import {supportsBLE} from '../core/structures/devices/configs/BLEConfig';
import {Emitter} from '../util/types';
import {IoTPublishToEvent} from '../core/events/dataClients/iot/IoTPublish';
import {BLEPeripheralCommandSend, BLEPeripheralSendEvent} from '../core/events/dataClients/ble/BLEPeripheral';
import {base64ToHex} from '../util/encodingUtils';

export class GoveeDevice extends State {
  static MODELS: string[] = [];

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super();
    this.deviceId = deviceConfig.deviceId;
    this.model = deviceConfig.model;
    this.name = deviceConfig.name;
    this.pactCode = deviceConfig.pactCode;
    this.pactType = deviceConfig.pactType;
    this.macAddress = deviceConfig.macAddress;
    this.iotTopic = supportsIoT(deviceConfig)?.deviceTopic ?? undefined;
    this.bleAddress = supportsBLE(deviceConfig)?.bleAddress ?? undefined;
    this.hardwareVersion = deviceConfig.hardwareVersion;
    this.softwareVersion = deviceConfig.softwareVersion;
  }

  public deviceId: string;
  public model: string;
  public name: string;
  public pactCode: number;
  public pactType: number;
  public iotTopic?: string;
  public bleAddress?: string;
  public macAddress?: string;
  public hardwareVersion?: string;
  public softwareVersion?: string;

  public send(
    command: string,
    emitter: Emitter,
  ) {
    const event = this.getIoTEvent(command) || this.getBleEvent(command);
    if (event) {
      emitter.emit(event);
      return;
    }
  }

  public updateState(state: DeviceState) {
    this.parse(state);
  }

  getIoTEvent(command: string): IoTPublishToEvent | undefined {
    if (!this.iotTopic) {
      return undefined;
    }
    return new IoTPublishToEvent(
      this.iotTopic,
      JSON.stringify({
        topic: this.iotTopic,
        msg: {
          device: this.deviceId,
          cmd: 'ptReal',
          cmdVersion: 0,
          transaction: `u_${Date.now()}`,
          type: 1,
          data: {
            command: [
              command,
            ],
          },
        },
      }),
    );
  }

  getBleEvent(command: string): BLEPeripheralSendEvent | undefined {
    if (!this.bleAddress) {
      return undefined;
    }

    return new BLEPeripheralSendEvent(
      new BLEPeripheralCommandSend(
        this.bleAddress.toLowerCase(),
        this.deviceId,
        [base64ToHex(command)],
      ),
    );
  }
}
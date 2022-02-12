import {State} from './states/State';
import {DeviceConfig} from '../core/structures/devices/DeviceConfig';
import {supportsIoT} from '../core/structures/devices/configs/IoTConfig';
import {DeviceState} from '../core/structures/devices/DeviceState';
import {supportsBLE} from '../core/structures/devices/configs/BLEConfig';
import {Emitter} from '../util/types';
import {IoTPublishToEvent} from '../core/events/dataClients/iot/IoTPublish';
import {BLEPeripheralCommandSend, BLEPeripheralSendEvent} from '../core/events/dataClients/ble/BLEPeripheral';
import {DeviceTransition} from '../core/structures/devices/DeviceTransition';
import {getIoTCommandMessage} from '../core/structures/iot/IoTCommandMessage';

export class GoveeDevice extends State {

  constructor(
    deviceConfig: DeviceConfig,
  ) {
    super();
    this.updateConfig(deviceConfig);
  }

  public deviceId!: string;
  public model!: string;
  public name!: string;
  public pactCode!: number;
  public pactType!: number;
  public iotTopic?: string;
  public bleAddress?: string;
  public macAddress?: string;
  public hardwareVersion?: string;
  public softwareVersion?: string;

  public updateConfig(
    deviceConfig: DeviceConfig,
  ) {
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

  public send<StateType extends State & GoveeDevice>(
    transition: DeviceTransition<StateType>,
    emitter: Emitter,
  ) {
    const event = this.getIoTEvent(transition) || this.getBleEvent(transition);
    if (event) {
      emitter.emit(event);
      return;
    }
  }

  public updateState(state: DeviceState) {
    this.parse(state);
  }

  getIoTEvent<StateType extends State & GoveeDevice>(transition: DeviceTransition<StateType>): IoTPublishToEvent | undefined {
    if (!this.iotTopic) {
      return undefined;
    }
    return new IoTPublishToEvent(
      this.iotTopic,
      JSON.stringify({
        topic: this.iotTopic,
        msg: getIoTCommandMessage(transition),
      }),
    );
  }

  getBleEvent<StateType extends State & GoveeDevice>(transition: DeviceTransition<StateType>): BLEPeripheralSendEvent | undefined {
    if (!this.bleAddress) {
      return undefined;
    }

    return new BLEPeripheralSendEvent(
      new BLEPeripheralCommandSend(
        this.bleAddress.toLowerCase(),
        this.deviceId,
        [transition.opCodeCommand],
      ),
    );
  }
}
import { State } from './states/State';
import { DeviceConfig } from '../core/structures/devices/DeviceConfig';
import { supportsIoT } from '../core/structures/devices/configs/IoTConfig';
import { DeviceState } from '../core/structures/devices/DeviceState';
import { supportsBLE } from '../core/structures/devices/configs/BLEConfig';
import { Emitter } from '../util/types';
import { IoTPublishToEvent } from '../core/events/dataClients/iot/IoTPublish';
import { BLEPeripheralCommandSend, BLEPeripheralSendEvent } from '../core/events/dataClients/ble/BLEPeripheral';
import { DeviceTransition } from '../core/structures/devices/DeviceTransition';
import { getIoTCommandMessage } from '../core/structures/iot/IoTCommandMessage';
import { DevicePollRequest } from '../core/events/devices/DeviceRequests';

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
  public goodsType!: number;
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
    this.goodsType = deviceConfig.goodsType;
    this.macAddress = deviceConfig.macAddress;
    this.iotTopic = supportsIoT(deviceConfig)?.deviceTopic ?? undefined;
    this.bleAddress = supportsBLE(deviceConfig)?.bleAddress ?? undefined;
    this.hardwareVersion = deviceConfig.hardwareVersion;
    this.softwareVersion = deviceConfig.softwareVersion;
  }

  public send<StateType extends State & GoveeDevice>(
    transition: DeviceTransition<StateType>,
    emitter: Emitter,
    accountTopic?: string,
  ) {
    const event = this.getIoTEvent(transition, accountTopic) || this.getBleEvent(transition);
    if (event) {
      emitter.emit(event);
      emitter.emit(new DevicePollRequest(this.deviceId));
      return;
    }
  }

  public updateState(state: DeviceState) {
    this.parse(state);
  }

  getIoTEvent<StateType extends State & GoveeDevice>(
    transition: DeviceTransition<StateType>,
    accountTopic?: string,
  ): IoTPublishToEvent | undefined {
    if (!this.iotTopic) {
      return undefined;
    }
    const commandMessage = getIoTCommandMessage(transition);
    commandMessage.accountTopic = accountTopic;

    if (!commandMessage.isValid()) {
      return undefined;
    }
    return new IoTPublishToEvent(
      accountTopic!,
      JSON.stringify({
        topic: this.iotTopic,
        msg: commandMessage,
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
        transition.opCodeCommand,
      ),
    );
  }
}
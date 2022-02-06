import {DeviceState} from '../../core/structures/devices/DeviceState';
import {Injectable} from '@nestjs/common';
import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {DeviceStateReceived} from '../../core/events/devices/DeviceReceived';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {LoggingService} from '../../logging/LoggingService';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {
  BLEPeripheralCommandSend,
  BLEPeripheralSendEvent,
  BLEPeripheralStateReceive,
} from '../../core/events/dataClients/ble/BLEPeripheral';
import {getCommandCodes} from '../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../util/const';
import {BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';

@Injectable()
export class BLEPayloadProcessor extends Emitter {
  private bleConnected = false;
  private readonly discoveredPeripherals: string[] = [];
  private readonly stateRequests: Map<string, GoveeDevice> = new Map<string, GoveeDevice>();

  constructor(
    private readonly log: LoggingService,
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'BLE.CONNECTION',
    {
      async: true,
    },
  )
  onBLEConnection(connection: ConnectionState) {
    this.bleConnected = connection === ConnectionState.Connected;
  }

  @OnEvent(
    'BLE.PERIPHERAL.Discovered',
    {
      async: true,
    },
  )
  onBLEPeripheralConnection(deviceIdentification: BLEDeviceIdentification) {
    this.discoveredPeripherals.push(deviceIdentification.bleAddress.toLowerCase());
    const device = this.stateRequests.get(deviceIdentification.deviceId);
    if (device) {
      this.log.info('BLE Peripheral Discovered', 'Requesting State', device);
      this.stateRequests.delete(deviceIdentification.deviceId);
      this.onRequestDeviceState(device);
    }
  }

  @OnEvent(
    'BLE.PERIPHERAL.Receive',
    {
      async: true,
    },
  )
  onPeripheralReceive(state: BLEPeripheralStateReceive) {
    this.log.info('BLE Peripheral Receive', state);
    try {
      const devState = toDeviceState(
        state.deviceId,
        state.state,
      );
      this.emit(
        new DeviceStateReceived(devState),
      );
    } catch (err) {
      this.log.error(err);
    }
  }

  @OnEvent(
    'DEVICE.REQUEST.State',
    {
      async: true,
    },
  )
  onRequestDeviceState(
    device: GoveeDevice,
  ) {
    if (!device.bleAddress) {
      return;
    }
    if (!this.bleConnected) {
      this.log.info('RequestDeviceState', 'BLE is not connected');
      return;
    }
    if (!this.discoveredPeripherals.includes(device.bleAddress.toLowerCase())) {
      this.log.info('RequestDeviceState', `BLE Peripheral ${device.deviceId} is not connected`);
      this.stateRequests.set(device.deviceId, device);
      return;
    }
    this.log.info('RequestDeviceState', 'codes', device.deviceStatusCodes);
    this.emit(
      new BLEPeripheralSendEvent(
        new BLEPeripheralCommandSend(
          device.bleAddress!.toLowerCase(),
          device.deviceId,
          device.deviceStatusCodes.map(
            (statusCodes) =>
              getCommandCodes(
                REPORT_IDENTIFIER,
                statusCodes,
              ),
          ),
        ),
      ),
    );
  }
}

export function toDeviceState(
  deviceId: string,
  state: number[],
): DeviceState {
  return {
    deviceId: deviceId,
    commands: [state],
  };
}
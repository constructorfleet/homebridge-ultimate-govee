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
  BLEPeripheralConnectionState,
  BLEPeripheralSendEvent,
  BLEPeripheralStateReceive,
} from '../../core/events/dataClients/ble/BLEPeripheral';
import {getCommandCodes} from '../../util/opCodeUtils';
import {REPORT_IDENTIFIER} from '../../util/const';

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
    'BLE.PERIPHERAL.Connection',
    {
      async: true,
    },
  )
  onBLEPeripheralConnection(connection: BLEPeripheralConnectionState) {
    this.log.info('BLE Peripheral Connection', connection.deviceId, connection.connectionState === ConnectionState.Connected);
    this.discoveredPeripherals.push(connection.bleAddress.toLowerCase());
    this.log.info('BLE Peripheral Connections', this.stateRequests);
    if (connection.connectionState === ConnectionState.Connected) {
      const device = this.stateRequests.get(connection.deviceId);
      this.log.info('BLE Peripheral Connections', 'Requesting State', device);
      if (device) {
        this.stateRequests.delete(connection.deviceId);
        this.onRequestDeviceState(device);
      }
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
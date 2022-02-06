import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Characteristic, Peripheral, Service} from '@abandonware/noble';
import {BLEConnectionStateEvent, BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';
import {Emitter} from '../../util/types';
import {Lock} from 'async-await-mutex-lock';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {
  BLEPeripheralCommandSend,
  BLEPeripheralConnectionEvent,
  BLEPeripheralConnectionState,
  BLEPeripheralReceiveEvent,
  BLEPeripheralStateReceive,
} from '../../core/events/dataClients/ble/BLEPeripheral';
import {bufferToHex} from '../../util/encodingUtils';

@Injectable()
export class BLEClient
  extends GoveeClient {
  private static readonly STATE_POWERED_ON = 'poweredOn';
  private static readonly SERVICE_CONTROL_UUID = '000102030405060708090a0b0c0d1910';
  private static readonly CHARACTERISTIC_CONTROL_UUID = '000102030405060708090a0b0c0d2b11';
  private static readonly CHARACTERISTIC_REPORT_UUID = '000102030405060708090a0b0c0d2b10';

  private subscriptions: Map<string, BLEDeviceIdentification> = new Map<string, BLEDeviceIdentification>();
  private peripheralConnections: Map<string, BLEPeripheralConnection> = new Map<string, BLEPeripheralConnection>();
  private peripherals: Map<string, Peripheral> = new Map<string, Peripheral>();
  private scanning = false;
  private online = false;
  private peripheralConnectionLock = new Lock<void>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    noble.on(
      'stateChange',
      async (state) => {
        this.log.info('BLEClient', 'StateChange', state);
        if (state === BLEClient.STATE_POWERED_ON) {
          this.online = true;
          await this.startScanning();
          this.emit(
            new BLEConnectionStateEvent(ConnectionState.Connected),
          );
        } else {
          this.online = false;
          this.emit(
            new BLEConnectionStateEvent(ConnectionState.Offline),
          );
          await this.stopScanning();
        }
      },
    );

    noble.on(
      'scanStart',
      async () => {
        this.scanning = true;
        this.log.info('BLEClient', 'ScanStart');
      },
    );

    noble.on(
      'scanStop',
      async () => {
        this.scanning = false;
        this.log.info('BLEClient', 'ScanStop');
      },
    );

    noble.on(
      'discover',
      async (peripheral: Peripheral) => {
        const peripheralAddress = peripheral.address.toLowerCase();
        this.peripherals.set(peripheralAddress, peripheral);
        this.log.info('BLEClient', 'OnDiscover', peripheralAddress);
        await this.createPeripheralConnection(
          peripheralAddress,
          peripheral,
        );
      },
    );
  }

  @OnEvent(
    'BLE.Subscribe',
    {
      async: true,
    },
  )
  async onBLEDeviceSubscribe(bleDeviceIdentification: BLEDeviceIdentification) {
    const address = bleDeviceIdentification.bleAddress.toLowerCase();
    this.subscriptions.set(address, bleDeviceIdentification);
    const peripheral = this.peripherals.get(address);
    if (peripheral) {
      await this.createPeripheralConnection(
        address,
        peripheral,
      );
    }
    await this.startScanning();
  }

  @OnEvent(
    'BLE.PERIPHERAL.Send',
    {
      async: true,
    },
  )
  async onSendCommand(command: BLEPeripheralCommandSend) {
    this.log.info('BLEClient', 'OnSendCommand', command);
    const peripheralConnection = this.peripheralConnections.get(command.deviceId);
    if (!peripheralConnection) {
      return;
    }

    await this.peripheralConnectionLock.acquire();
    try {
      await peripheralConnection.connect();
      for (let i = 0; i < command.state.length; i++) {
        this.log.info('BLEClient', 'OnSendCommand', 'Writing', command.state[i]);
        await peripheralConnection.writeCommand(command.state[i]);
      }
    } finally {
      this.peripheralConnectionLock.release();
    }
  }

  private async createPeripheralConnection(
    address: string,
    peripheral: Peripheral,
  ) {
    const deviceIdentification = this.subscriptions.get(address);
    if (!deviceIdentification) {
      return;
    }
    let peripheralConnection = this.peripheralConnections.get(deviceIdentification.deviceId);
    if (!peripheralConnection) {
      peripheralConnection =
        new BLEPeripheralConnection(
          this.emitter,
          this.peripheralConnectionLock,
          BLEClient.SERVICE_CONTROL_UUID,
          BLEClient.CHARACTERISTIC_CONTROL_UUID,
          BLEClient.CHARACTERISTIC_REPORT_UUID,
          deviceIdentification,
          peripheral,
          this.log,
        );

      this.peripheralConnections.set(
        deviceIdentification.deviceId,
        peripheralConnection,
      );
    }

    if (!peripheralConnection.discovered) {
      await this.stopScanning();
      await this.peripheralConnectionLock.acquire();
      try {
        await peripheralConnection.connect();
        await peripheralConnection.discoverCharacteristics();
      } finally {
        this.peripheralConnectionLock.release();
      }
    }
    await this.startScanning();
  }

  private async stopScanning() {
    if (this.scanning) {
      this.scanning = false;
      await noble.stopScanningAsync();
    }
  }

  private async startScanning() {
    if (!this.scanning) {
      this.scanning = true;
      await noble.startScanningAsync(
        [],
        false,
      );
    }
  }
}

export class BLEPeripheralConnection
  extends Emitter {

  private controlCharacteristic?: Characteristic;
  private reportCharacteristic?: Characteristic;
  private writeLock = new Lock();
  public isConnected = false;
  public discovered = false;

  constructor(
    eventEmitter: EventEmitter2,
    private readonly peripheralConnectionLock: Lock<void>,
    private readonly controlServiceUUID: string,
    private readonly controlCharacteristicUUID: string,
    private readonly reportCharacteristicUUID: string,
    public readonly deviceIdentification: BLEDeviceIdentification,
    private readonly peripheral: Peripheral,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    peripheral.removeAllListeners();

    peripheral.on(
      'connect',
      this.onConnect,
    );

    peripheral.on(
      'disconnect',
      this.onDisconnect,
    );
  }

  async connect() {
    if (!this.isConnected) {
      await this.peripheral.connectAsync();
    }
  }

  async writeCommand(command: number[]) {
    await this.writeLock.acquire();
    this.reportCharacteristic!.removeAllListeners();
    this.reportCharacteristic!.once(
      'data',
      this.onDataCallback,
    );
    await this.controlCharacteristic!.writeAsync(
      Buffer.of(...command),
      true,
    );
  }

  async discoverCharacteristics() {
    if (this.discovered) {
      return;
    }
    this.discovered = true;
    const services = await this.peripheral.discoverServicesAsync(
      [this.controlServiceUUID],
    );
    for (let i = 0; i < services.length; i++) {
      await this.discoverServiceCharacteristics(services[i]);
    }
  }

  private async discoverServiceCharacteristics(service: Service) {
    const characteristics = await service.discoverCharacteristicsAsync(
      [
        this.reportCharacteristicUUID,
        this.controlCharacteristicUUID,
      ],
    );
    for (let i = 0; i < characteristics.length; i++) {
      const characteristic = characteristics[i];
      if (characteristic.uuid === this.reportCharacteristicUUID) {
        this.reportCharacteristic = characteristic;
      } else if (characteristic.uuid === this.controlCharacteristicUUID) {
        this.controlCharacteristic = characteristic;
      }

      await this.logCharacteristic(service, characteristic);
    }
  }

  private async logCharacteristic(service: Service, characteristic: Characteristic) {
    const descriptors = await characteristic.discoverDescriptorsAsync();
    const descriptorLogs: string[] = [];
    for (let i = 0; i < descriptors.length; i++) {
      descriptorLogs.push(JSON.stringify({
        name: descriptors[i].name,
        uuid: descriptors[i].uuid,
        type: descriptors[i].type,
        value: (await descriptors[i].readValueAsync()).toString('hex'),
      }));
    }
    const characteristicValue = await characteristic.readAsync();
    this.log.info(
      {
        peripheral: this.bleAddress,
        service: {
          name: service.name,
          uuid: service.uuid,
        },
        characteristic: {
          name: characteristic.name,
          uuid: characteristic.uuid,
          value: characteristicValue,
          properties: characteristic.properties,
          descriptors: descriptorLogs,
        },
      });
  }

  private onConnect = (error?: Error) => {
    if (error) {
      this.log.error(this.deviceId, error);
      return;
    }
    this.isConnected = true;
    this.emit(
      new BLEPeripheralConnectionEvent(
        new BLEPeripheralConnectionState(
          this.bleAddress,
          this.deviceId,
          ConnectionState.Connected,
        ),
      ),
    );
  };

  private onDisconnect = (error?: Error) => {
    if (error) {
      this.log.error(this.deviceId, error);
      return;
    }
    this.isConnected = false;
    this.emit(
      new BLEPeripheralConnectionEvent(
        new BLEPeripheralConnectionState(
          this.bleAddress,
          this.deviceId,
          ConnectionState.Offline,
        ),
      ),
    );
  };

  private onDataCallback = (data: Buffer) => {
    this.log.info(
      'Characteristic',
      'OnData',
      {
        charName: this.reportCharacteristic?.name,
        charUUID: this.reportCharacteristic?.uuid,
        deviceId: this.deviceId,
        bleAddress: this.bleAddress,
        data: data,
      },
    );
    this.emit(
      new BLEPeripheralReceiveEvent(
        new BLEPeripheralStateReceive(
          this.bleAddress,
          this.deviceId,
          bufferToHex(data),
        ),
      ),
    );
    this.writeLock.release();
  };

  private get deviceId(): string {
    return this.deviceIdentification.deviceId;
  }

  private get bleAddress(): string {
    return this.deviceIdentification.bleAddress.toLowerCase();
  }
}

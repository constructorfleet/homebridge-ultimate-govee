import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Characteristic, Peripheral, Service} from '@abandonware/noble';
import {BLEConnectionStateEvent, BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';
import {Emitter} from '../../util/types';
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
          if (!this.scanning) {
            this.scanning = true;
            await noble.startScanningAsync([], true);
          }
          this.emit(
            new BLEConnectionStateEvent(ConnectionState.Connected),
          );
        } else {
          this.emit(
            new BLEConnectionStateEvent(ConnectionState.Offline),
          );
          this.online = false;
          if (this.scanning) {
            await noble.stopScanningAsync();
          }
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
        const peripheralConnection = this.createPeripheralConnection(
          peripheralAddress,
          peripheral,
        );
        if (peripheralConnection && !peripheralConnection.isConnected) {
          await peripheralConnection.connect();
        }
      },
    );
  }

  createPeripheralConnection(
    address: string,
    peripheral: Peripheral,
  ): BLEPeripheralConnection | undefined {
    const deviceIdentification = this.subscriptions.get(address);
    if (!deviceIdentification) {
      this.log.debug('BLEClient', 'Unknown Address', address);
      return;
    }
    let peripheralConnection = this.peripheralConnections.get(deviceIdentification.deviceId);
    if (peripheralConnection) {
      return peripheralConnection;
    }

    peripheralConnection =
      new BLEPeripheralConnection(
        this.emitter,
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

    return peripheralConnection;
  }

  @OnEvent(
    'BLE.Subscribe',
    {
      async: true,
    },
  )
  async onBLEDeviceSubscribe(bleDeviceIdentification: BLEDeviceIdentification) {
    const address = bleDeviceIdentification.bleAddress.toLowerCase();
    if (!this.subscriptions.has(address)) {
      this.subscriptions.set(address, bleDeviceIdentification);
    }
    const peripheral = this.peripherals.get(address);
    if (peripheral) {
      const peripheralConnection = this.createPeripheralConnection(
        address,
        peripheral,
      );

      if (peripheralConnection && !peripheralConnection.isConnected) {
        await peripheralConnection.connect();
      }
    }

    if (!this.scanning && this.online) {
      this.scanning = true;
      noble.startScanning(
        [],
        true,
        (error?: Error) => {
          if (error) {
            this.log.error(error);
          }
        });
    }
  }
}

export class BLEPeripheralConnection
  extends Emitter {

  private controlCharacteristic?: BLEPeripheralControlCharacteristic;
  private reportCharacteristic?: BLEPeripheralReportingCharacteristic;
  public isConnected = false;

  constructor(
    eventEmitter: EventEmitter2,
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
    await this.peripheral.connectAsync();
    this.log.info(this.peripheral.advertisement);
    const services = await this.peripheral.discoverServicesAsync(
      [this.controlServiceUUID],
    );
    for (let i = 0; i < services.length; i++) {
      await this.discoverServiceCharacteristics(services[i]);
    }
  }

  async discoverServiceCharacteristics(service: Service) {
    const characteristics = await service.discoverCharacteristicsAsync(
      [
        this.reportCharacteristicUUID,
        this.controlCharacteristicUUID,
      ],
    );
    for (let i = 0; i < characteristics.length; i++) {
      const characteristic = characteristics[i];
      if (characteristic.uuid === this.reportCharacteristicUUID) {
        this.reportCharacteristic =
          new BLEPeripheralReportingCharacteristic(
            this.emitter,
            characteristic,
            this.deviceIdentification.deviceId,
            this.deviceIdentification.bleAddress,
            this.log,
          );
      }
      if (characteristic.uuid === this.controlCharacteristicUUID) {
        this.controlCharacteristic =
          new BLEPeripheralControlCharacteristic(
            this.emitter,
            characteristic,
            this.deviceIdentification.deviceId,
            this.deviceIdentification.bleAddress,
            this.log,
          );
      }
      await this.logCharacteristic(service, characteristic);
    }
  }

  async logCharacteristic(service: Service, characteristic: Characteristic) {
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
        peripheral: this.peripheral.address.toLowerCase(),
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

  public onConnect = (error?: Error) => {
    if (error) {
      this.log.error(this.deviceIdentification.deviceId, error);
      return;
    }
    this.isConnected = true;
    this.emit(
      new BLEPeripheralConnectionEvent(
        new BLEPeripheralConnectionState(
          this.deviceIdentification.bleAddress,
          this.deviceIdentification.deviceId,
          ConnectionState.Connected,
        ),
      ),
    );
  };

  public onDisconnect = (error?: Error) => {
    if (error) {
      this.log.error(this.deviceIdentification.deviceId, error);
      return;
    }
    this.isConnected = false;
    this.emit(
      new BLEPeripheralConnectionEvent(
        new BLEPeripheralConnectionState(
          this.deviceIdentification.bleAddress,
          this.deviceIdentification.deviceId,
          ConnectionState.Offline,
        ),
      ),
    );
  };
}

export abstract class BLEPeripheralCharacteristic extends Emitter {
  protected constructor(
    emitter: EventEmitter2,
    readonly characteristic: Characteristic,
    readonly deviceId: string,
    readonly bleAddress: string,
    readonly log: LoggingService,
  ) {
    super(emitter);
  }
}

export class BLEPeripheralReportingCharacteristic extends BLEPeripheralCharacteristic {
  constructor(
    emitter: EventEmitter2,
    characteristic: Characteristic,
    deviceId: string,
    bleAddress: string,
    log: LoggingService,
  ) {
    super(
      emitter,
      characteristic,
      deviceId,
      bleAddress,
      log,
    );

    characteristic.on(
      'data',
      this.onDataCallback,
    );
  }

  public onDataCallback = (data: Buffer) => {
    this.log.info(
      'Characteristic',
      'OnData',
      {
        charName: this.characteristic.name,
        charUUID: this.characteristic.uuid,
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
  };
}

export class BLEPeripheralControlCharacteristic extends BLEPeripheralCharacteristic {
  constructor(
    emitter: EventEmitter2,
    characteristic: Characteristic,
    deviceId: string,
    bleAddress: string,
    log: LoggingService,
  ) {
    super(
      emitter,
      characteristic,
      deviceId,
      bleAddress,
      log,
    );
  }

  @OnEvent(
    'BLE.PERIPHERAL.send',
    {
      async: true,
    },
  )
  async onSendCommand(command: BLEPeripheralCommandSend) {
    if (command.deviceId !== this.deviceId || command.bleAddress !== this.bleAddress) {
      return;
    }
    this.log.info('BlEPeripheral', 'Writing to', command.deviceId);
    await this.characteristic.writeAsync(
      Buffer.of(...command.state),
      true,
    );
  }
}
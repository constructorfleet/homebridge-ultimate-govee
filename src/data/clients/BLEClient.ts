import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Characteristic, Peripheral, Service} from '@abandonware/noble';
import {BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';
import {Emitter} from '../../util/types';

@Injectable()
export class BLEClient
  extends GoveeClient {
  private static readonly STATE_POWERED_ON = 'poweredOn';
  private static readonly SERVICE_CONTROL_UUID = '000102030405060708090a0b0c0d1910';
  private static readonly CHARACTERISTIC_CONTROL_UUID = '000102030405060708090a0b0c0d2b11';

  private subscriptions: Map<string, BLEDeviceIdentification> = new Map<string, BLEDeviceIdentification>();
  private peripherals: Map<string, BLEPeripheralConnection> = new Map<string, BLEPeripheralConnection>();
  private connections: Set<string> = new Set<string>();
  private devices: Set<string> = new Set<string>();
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
          this.scanning = true;
          await noble.startScanningAsync([], true);
        } else {
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
        if (!this.subscriptions.has(peripheral.address.toLowerCase())) {
          this.log.info('BLEClient', 'Unknown Address', peripheral.address);
          return;
        }
        if (this.peripherals.has(peripheral.address.toLowerCase())) {
          this.log.info('BLEClient', 'Already Known', peripheral.address);
          return;
        }
        this.devices.add(peripheral.address.toLowerCase());

        this.log.info('BLEClient', 'Creating Connection', peripheral.address);
        const peripheralConnection = new BLEPeripheralConnection(
          this.emitter,
          BLEClient.SERVICE_CONTROL_UUID,
          BLEClient.CHARACTERISTIC_CONTROL_UUID,
          this.subscriptions[peripheral.address.toLowerCase()],
          peripheral,
          this.log,
        );
        this.peripherals.set(peripheral.address.toLowerCase(), peripheralConnection);
        if (this.peripherals.size === this.subscriptions.size) {
          await this.connectToPeripherals();
        }
      },
    );
  }

  async connectToPeripherals() {
    if (this.scanning) {
      await noble.stopScanningAsync();
    }
    const connectPromises = Array.from(
      this.peripherals.values(),
    ).filter(
      (peripheral: BLEPeripheralConnection) => !this.connections.has(peripheral.peripheral.address.toLowerCase()),
    ).map(
      (peripheral: BLEPeripheralConnection) => {
        this.connections.add(peripheral.peripheral.address.toLowerCase());
        return peripheral.connect();
      },
    );
    await Promise.all(connectPromises);
  }

  @OnEvent(
    'BLE.Subscribe',
    {
      async: true,
    },
  )
  onBLEDeviceSubscribe(bleDeviceId: BLEDeviceIdentification) {
    this.log.info('BLEClient', 'Subscribing', bleDeviceId.deviceId, bleDeviceId.bleAddress);
    this.subscriptions.set(bleDeviceId.bleAddress.toLocaleLowerCase(), bleDeviceId);
    if (!this.scanning) {
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

  private readonly bleCharacteristics: BLEPeripheralCharacteristic[] = [];

  constructor(
    eventEmitter: EventEmitter2,
    private readonly controlServiceUUID: string,
    private readonly controlCharacteristicUUID: string,
    private readonly deviceIdentification: BLEDeviceIdentification,
    public readonly peripheral: Peripheral,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    peripheral.removeAllListeners();
  }

  async connect() {
    await this.peripheral.connectAsync();
    this.log.info(this.peripheral.advertisement);
    const services = await this.peripheral.discoverServicesAsync(
      [],
    );
    for (let i = 0; i < services.length; i++) {
      await this.discoverServiceCharacteristics(services[i]);
    }
    this.log.info(this.peripheral.advertisement);
  }

  async discoverServiceCharacteristics(service: Service) {
    const characteristics = await service.discoverCharacteristicsAsync(
      [],
    );
    for (let i = 0; i < characteristics.length; i++) {
      await this.readCharacteristicValue(service, characteristics[i]);
    }
  }

  async readCharacteristicValue(service: Service, characteristic: Characteristic) {
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
    this.bleCharacteristics.push(
      new BLEPeripheralCharacteristic(
        characteristic,
        this.deviceIdentification.deviceId,
        this.deviceIdentification.bleAddress,
        this.log,
      ),
    );
    if (characteristic.uuid === this.controlCharacteristicUUID) {
      await characteristic.writeAsync(
        Buffer.from(
          [0xaa, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xab],
        ),
        true,
      );
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
}

export class BLEPeripheralCharacteristic {
  constructor(
    readonly characteristic: Characteristic,
    readonly deviceId: string,
    readonly bleAddress: string,
    readonly log: LoggingService,
  ) {
    this.onDataCallback.bind(this);
    characteristic.on(
      'data',
      this.onDataCallback,
    );
  }

  public onDataCallback(data: Buffer) {
    this.log.info(
      {
        charName: this.characteristic.name,
        charUUID: this.characteristic.uuid,
        deviceId: this.deviceId,
        bleAddress: this.bleAddress,
        data: data,
      },
    );
  }
}
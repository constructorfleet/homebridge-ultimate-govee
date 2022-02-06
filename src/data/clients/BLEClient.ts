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
        const peripheralAddress = peripheral.address.toLowerCase();
        if (!this.subscriptions.has(peripheralAddress)) {
          this.log.info('BLEClient', 'Unknown Address', peripheralAddress);
          return;
        }
        if (this.peripherals.has(peripheralAddress)) {
          this.log.info('BLEClient', 'Already Known', peripheralAddress);
          return;
        }

        const peripheralConnection = new BLEPeripheralConnection(
          this.emitter,
          BLEClient.SERVICE_CONTROL_UUID,
          BLEClient.CHARACTERISTIC_CONTROL_UUID,
          this.subscriptions.get(peripheralAddress)!,
          peripheral,
          this.log,
        );
        this.peripherals.set(peripheralAddress, peripheralConnection);
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
      (peripheral: BLEPeripheralConnection) => !this.connections.has(peripheral.deviceIdentification.bleAddress),
    ).map(
      (peripheral: BLEPeripheralConnection) => {
        this.connections.add(peripheral.deviceIdentification.bleAddress);
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
    if (!this.subscriptions.has(bleDeviceId.bleAddress)) {
      this.subscriptions.set(bleDeviceId.bleAddress, bleDeviceId);
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
}

export class BLEPeripheralConnection
  extends Emitter {

  private readonly bleCharacteristics: Map<string, BLEPeripheralCharacteristic> = new Map<string, BLEPeripheralCharacteristic>();

  constructor(
    eventEmitter: EventEmitter2,
    private readonly controlServiceUUID: string,
    private readonly controlCharacteristicUUID: string,
    public readonly deviceIdentification: BLEDeviceIdentification,
    private readonly peripheral: Peripheral,
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
  }

  async discoverServiceCharacteristics(service: Service) {
    const characteristics = await service.discoverCharacteristicsAsync(
      [],
    );
    for (let i = 0; i < characteristics.length; i++) {
      if (!this.bleCharacteristics.has(characteristics[i].uuid)) {
        await this.readCharacteristicValue(service, characteristics[i]);
      }
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
    if (characteristic.properties.includes('notify') || characteristic.properties.includes('indicate')) {
      this.bleCharacteristics.set(
        characteristic.uuid,
        new BLEPeripheralCharacteristic(
          characteristic,
          this.deviceIdentification.deviceId,
          this.deviceIdentification.bleAddress,
          this.log,
        ),
      );
    }
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
  }
}
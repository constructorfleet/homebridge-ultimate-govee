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
  private connections: Map<string, BLEPeripheralConnection> = new Map<string, BLEPeripheralConnection>();
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
          await noble.startScanningAsync();
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
        if (this.connections.has(peripheral.address.toLocaleLowerCase())) {
          this.log.info('BLEClient', 'Already Connected', peripheral.address);
          return;
        }
        if (this.devices.has(peripheral.address.toLowerCase())) {
          return;
        }

        await this.connectTo(peripheral);
      },
    );
  }

  async connectTo(peripheral: Peripheral) {
    this.devices.add(peripheral.address.toLocaleLowerCase());

    this.log.info('BLEClient', 'Creating Connection', peripheral.address);
    const peripheralConnection = new BLEPeripheralConnection(
      this.emitter,
      BLEClient.SERVICE_CONTROL_UUID,
      BLEClient.CHARACTERISTIC_CONTROL_UUID,
      this.subscriptions[peripheral.address.toLowerCase()],
      peripheral,
      this.log,
    );
    this.connections.set(peripheral.address.toLowerCase(), peripheralConnection);
    if (this.scanning) {
      await noble.stopScanningAsync();
    }

    await peripheralConnection.connect();
    this.connections.delete(peripheral.address.toLowerCase());
    if (!this.scanning) {
      await noble.startScanningAsync();
    }
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
  }
}

export class BLEPeripheralConnection
  extends Emitter {

  constructor(
    eventEmitter: EventEmitter2,
    private readonly controlServiceUUID: string,
    private readonly controlCharacteristicUUID: string,
    private readonly deviceIdentification: BLEDeviceIdentification,
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
    await this.peripheral.disconnectAsync();
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
    if (characteristic.uuid === this.controlCharacteristicUUID) {
      await characteristic.writeAsync(
        Buffer.from(
          [
            170, 7, 3, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 174,
          ],
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
        },
      });
    try {
      this.log.info(characteristicValue.toString('hex'));
    } catch (e) {
      this.log.error(e);
    }
  }
}
import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Characteristic, Peripheral} from '@abandonware/noble';
import {BLEConnectionStateEvent, BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';
import {sleep} from '../../util/types';
import {Lock} from 'async-await-mutex-lock';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {
  BLEPeripheralCommandSend,
  BLEPeripheralDiscoveredEvent,
  BLEPeripheralReceiveEvent,
  BLEPeripheralStateReceive,
} from '../../core/events/dataClients/ble/BLEPeripheral';
import {bufferToHex} from '../../util/encodingUtils';

interface IdentifiedPeripheral {
  peripheral: Peripheral;
  deviceIdentification: BLEDeviceIdentification;
}

interface ControlReportCharacteristics {
  controlCharacteristic: Characteristic;
  reportCharacteristic: Characteristic;
}

type BLEAddress = string;

type LockKey = 'PeripheralConnect' | 'PeripheralWrite';

@Injectable()
export class BLEClient
  extends GoveeClient {
  private static readonly STATE_POWERED_ON = 'poweredOn';
  private static readonly SERVICE_CONTROL_UUID = '000102030405060708090a0b0c0d1910';
  private static readonly CHARACTERISTIC_CONTROL_UUID = '000102030405060708090a0b0c0d2b11';
  private static readonly CHARACTERISTIC_REPORT_UUID = '000102030405060708090a0b0c0d2b10';
  private static readonly BLE_NAME_REGEX = new RegExp(/ihoment_(?<model>[^_]+)_.*/);
  private subscriptions: Map<BLEAddress, BLEDeviceIdentification> = new Map<BLEAddress, BLEDeviceIdentification>();
  private peripherals: Map<BLEAddress, Peripheral> = new Map<BLEAddress, Peripheral>();
  private identifiedPeripherals: Map<BLEAddress, IdentifiedPeripheral> = new Map<BLEAddress, IdentifiedPeripheral>();
  private scanning = false;
  private online = false;
  private lock = new Lock<LockKey>();

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
        await noble.startScanningAsync(
          [],
          true,
        );
        // this.scanning = false;
        // this.log.info('BLEClient', 'ScanStop');
      },
    );

    noble.on(
      'discover',
      async (peripheral: Peripheral) => {
        const peripheralAddress = peripheral.address.toLowerCase();
        if (this.peripherals.has(peripheralAddress)) {
          return;
        }

        this.peripherals.set(
          peripheralAddress,
          peripheral,
        );

        const peripheralName = peripheral.advertisement.localName;
        const regexResult = BLEClient.BLE_NAME_REGEX.exec(peripheralName);
        const model = regexResult?.groups?.model;
        if (!model) {
          return;
        }

        await this.lock.acquire('PeripheralConnect');
        this.log.info(
          peripheralAddress,
          peripheral.advertisement,
          peripheral.uuid,
          peripheral.id,
          model,
        );
        try {
          await peripheral.connectAsync();
          const services = await peripheral.discoverServicesAsync();
          for (let i = 0; i < services.length; i++) {
            const service = services[i];
            this.log.info(
              'SERVICE',
              peripheralAddress,
              peripheralName,
              service.name,
              service.uuid,
            );

            const characteristics = await service.discoverCharacteristicsAsync();
            for (let j = 0; j < characteristics.length; j++) {
              const characteristic = characteristics[j];
              let charValue: Buffer | undefined = undefined;
              if (characteristic.properties.includes('read')) {
                charValue = await characteristic.readAsync();
              }
              if (characteristic.properties.includes('notify') || characteristic.properties.includes('indicate')) {
                characteristic.on('data', (data) => this.log.info('OnData', characteristic.uuid, data));
                await characteristic.subscribeAsync();
              }
              this.log.info(
                'CHAR',
                peripheralAddress,
                peripheralName,
                characteristic.name,
                characteristic.uuid,
                charValue,
              );

              const descriptors = await characteristic.discoverDescriptorsAsync();
              for (let k = 0; k < descriptors.length; k++) {
                const descriptor = descriptors[k];
                const descriptorValue = await descriptor.readValueAsync();
                this.log.info(
                  'DESC',
                  peripheralAddress,
                  peripheralName,
                  descriptor.name,
                  descriptor.uuid,
                  descriptorValue,
                );
              }
            }

          }
          await sleep(2000);
          await peripheral.disconnectAsync();
        } finally {
          await this.lock.release('PeripheralConnect');
        }
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
    await this.startScanning();
    const peripheral = this.peripherals.get(address);
    if (!peripheral) {
      return;
    }

    let identifiedPeripheral: IdentifiedPeripheral | undefined = undefined;
    await this.acquireLock(
      'PeripheralConnect',
      'BLEClient',
      'onSubscribe',
      peripheral.address.toLowerCase(),
    );
    await this.stopScanning();
    try {
      identifiedPeripheral = await this.tryGetIdentifiedPeripheral(peripheral);
    } finally {
      await this.releaseLock(
        'PeripheralConnect',
        'BLEClient',
        'onSubscribe',
        peripheral.address.toLowerCase(),
      );
      await this.startScanning();
    }

    if (!identifiedPeripheral) {
      return;
    }
    this.emit(
      new BLEPeripheralDiscoveredEvent(
        new BLEDeviceIdentification(
          identifiedPeripheral.deviceIdentification.bleAddress,
          identifiedPeripheral.deviceIdentification.deviceId,
        ),
      ),
    );
  }

  @OnEvent(
    'BLE.PERIPHERAL.Send',
    {
      async: true,
    },
  )
  async onSendCommand(command: BLEPeripheralCommandSend) {
    this.log.info('BLEClient', 'OnSendCommand', command);
    const peripheralAddress = command.bleAddress.toLowerCase();
    const identifiedPeripheral = this.identifiedPeripherals.get(peripheralAddress);
    if (!identifiedPeripheral) {
      return;
    }

    const peripheral = identifiedPeripheral.peripheral;
    const deviceIdentification = identifiedPeripheral.deviceIdentification;

    await this.acquireLock(
      'PeripheralConnect',
      'BLEClient',
      'OnSendCommand',
      command.bleAddress,
    );
    await this.stopScanning();
    try {
      if (peripheral.state !== 'connected') {
        await peripheral.connectAsync();
      }

      const controlReportCharacteristics = await this.tryGetCharacteristics(peripheral);

      if (!controlReportCharacteristics) {
        return;
      }

      const {
        reportCharacteristic,
        controlCharacteristic,
      } = controlReportCharacteristics;

      for (let i = 0; i < command.state.length; i++) {
        const state = command.state[i];
        await this.acquireLock(
          'PeripheralWrite',
          'BLEClient',
          'Sending',
          peripheralAddress,
          state,
        );
        reportCharacteristic.removeAllListeners();
        await reportCharacteristic.subscribeAsync();
        reportCharacteristic.on(
          'data',
          this.onDataCallback(deviceIdentification),
        );
        await controlCharacteristic.writeAsync(
          Buffer.of(...state),
          true,
        );
        await sleep(200);
      }
    } finally {
      await this.releaseLock(
        'PeripheralConnect',
        'BLEClient',
        'OnSendCommand',
        command.bleAddress,
      );
      await this.startScanning();
    }
  }

  private async tryGetCharacteristics(
    peripheral: Peripheral,
  ): Promise<ControlReportCharacteristics | undefined> {
    const services = await peripheral.discoverServicesAsync();
    const controlService =
      services.find(
        (service) => service.uuid === BLEClient.SERVICE_CONTROL_UUID,
      );
    if (!controlService) {
      return undefined;
    }
    const characteristics = await controlService.discoverCharacteristicsAsync();
    const reportCharacteristic =
      characteristics.find(
        (characteristic) => characteristic.uuid === BLEClient.CHARACTERISTIC_REPORT_UUID,
      );
    const controlCharacteristic =
      characteristics.find(
        (characteristic) => characteristic.uuid === BLEClient.CHARACTERISTIC_CONTROL_UUID,
      );
    if (!reportCharacteristic || !controlCharacteristic) {
      return undefined;
    }

    return {
      controlCharacteristic: controlCharacteristic,
      reportCharacteristic: reportCharacteristic,
    };
  }

  async tryGetIdentifiedPeripheral(
    peripheral: Peripheral,
  ): Promise<IdentifiedPeripheral | undefined> {
    const peripheralAddress = peripheral.address.toLowerCase();

    await peripheral.connectAsync();

    const controlReportCharacteristics = await this.tryGetCharacteristics(peripheral);

    if (controlReportCharacteristics) {
      this.peripherals.set(peripheralAddress, peripheral);

      const deviceIdentification = this.subscriptions.get(peripheralAddress);
      if (deviceIdentification) {
        const identifiedPeripheral = {
          deviceIdentification: deviceIdentification,
          peripheral: peripheral,
        };
        this.identifiedPeripherals.set(peripheralAddress, identifiedPeripheral);

        return identifiedPeripheral;
      }
    }
  }

  async stopScanning() {
    if (this.scanning) {
      this.scanning = false;
      await noble.stopScanningAsync();
    }
  }

  async startScanning() {
    if (!this.scanning) {
      this.scanning = true;
      await noble.startScanningAsync(
        [],
        true,
      );
    }
  }

  async acquireLock(
    key: LockKey,
    ...log: unknown[]
  ) {
    await this.lock.acquire(key);
    this.log.info(
      'BLEClient',
      'AcquireLock',
      key,
      ...log,
    );
  }

  async releaseLock(
    key: LockKey,
    ...log: string[]
  ) {
    this.log.info(
      'BLEClient',
      'ReleaseLock',
      key,
      ...log,
    );
    this.lock.release(key);
  }

  onDataCallback = (deviceIdentification: BLEDeviceIdentification) => (data: Buffer) => {
    this.releaseLock(
      'PeripheralWrite',
      'BLEClient',
      'onDataCallback',
      deviceIdentification.deviceId,
      data.toString(),
    ).then(() => {
      this.log.info(
        'BLEClient',
        'OnDataCallback',
        data,
      );
      if (data.length > 0) {
        this.emit(
          new BLEPeripheralReceiveEvent(
            new BLEPeripheralStateReceive(
              deviceIdentification.bleAddress,
              deviceIdentification.deviceId,
              bufferToHex(data),
            ),
          ),
        );
      }
    });
  };
}


import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Peripheral} from '@abandonware/noble';
import {BLEConnectionStateEvent, BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';
import {sleep} from '../../util/types';
import {Lock} from 'async-await-mutex-lock';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {
  BLEPeripheralCommandSend,
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
  private static readonly BLE_NAME_REGEX = new RegExp(/ihoment_(?<model>[^_]+)_.*/);

  private static parsePeripheralModel(
    peripheral: Peripheral,
  ): string | undefined {
    const peripheralName = peripheral.advertisement.localName;
    const regexResult = BLEClient.BLE_NAME_REGEX.exec(peripheralName);
    return regexResult?.groups?.model;
  }

  private peripherals: Map<string, Peripheral> = new Map<string, Peripheral>();
  private isScanning = false;
  private isOnline = false;
  private lock = new Lock<void>();
  connectedDevice?: BLEDeviceIdentification = undefined;

  constructor(
    eventEmitter: EventEmitter2,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    noble.on(
      'stateChange',
      async (state) => {
        this.log.debug(
          'BLEClient',
          'StateChange',
          state,
        );
        if (state === BLEClient.STATE_POWERED_ON) {
          this.isOnline = true;
          this.emit(
            new BLEConnectionStateEvent(ConnectionState.Connected),
          );
          await this.startScanning();
        } else {
          this.isScanning = false;
          this.isOnline = false;
          this.emit(
            new BLEConnectionStateEvent(ConnectionState.Offline),
          );
        }
      },
    );

    noble.on(
      'scanStart',
      async () => {
        this.isScanning = true;
        this.log.debug(
          'BLEClient',
          'ScanStart',
        );
      },
    );

    noble.on(
      'scanStop',
      async () => {
        this.isScanning = false;
        this.log.debug(
          'BLEClient',
          'ScanStop',
        );
      },
    );

    noble.on(
      'discover',
      async (peripheral: Peripheral) => {
        const bleAddress = peripheral.address.toLowerCase();
        const model = BLEClient.parsePeripheralModel(peripheral);
        if (!model || this.peripherals.has(bleAddress)) {
          return;
        }

        this.peripherals.set(
          bleAddress,
          peripheral,
        );
      },
    );
  }

  @OnEvent(
    'BLE.PERIPHERAL.Send',
    {
      async: true,
      nextTick: true,
    },
  )
  async onSendCommand(peripheralCommand: BLEPeripheralCommandSend) {
    this.log.info(
      'BLEClient',
      'OnSendCommand',
      peripheralCommand,
    );
    const peripheralAddress = peripheralCommand.bleAddress.toLowerCase();
    const peripheral = this.peripherals.get(peripheralAddress);
    if (!peripheral) {
      return;
    }


    await this.acquireLock(
      'BLEClient',
      'OnSendCommand',
      peripheralCommand.bleAddress,
    );

    if (peripheral.state !== 'connected') {
      await peripheral.connectAsync();
    }

    try {
      const serviceCharacteristics = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
        [BLEClient.SERVICE_CONTROL_UUID],
        [
          BLEClient.CHARACTERISTIC_REPORT_UUID,
          BLEClient.CHARACTERISTIC_CONTROL_UUID,
        ],
      );

      const controlCharacteristic = serviceCharacteristics.characteristics.find(
        (characteristic) => characteristic.uuid === BLEClient.CHARACTERISTIC_CONTROL_UUID,
      );
      const reportCharacteristic = serviceCharacteristics.characteristics.find(
        (characteristic) => characteristic.uuid === BLEClient.CHARACTERISTIC_REPORT_UUID,
      );

      if (controlCharacteristic && reportCharacteristic) {
        this.connectedDevice = new BLEDeviceIdentification(
          peripheralCommand.bleAddress,
          peripheralCommand.deviceId,
        );

        for (let i = 0; i < peripheralCommand.commands.length; i++) {
          const command = peripheralCommand.commands[i];
          reportCharacteristic.removeAllListeners();
          await reportCharacteristic.subscribeAsync();
          reportCharacteristic.on(
            'data',
            this.onDataCallback,
          );

          await controlCharacteristic.writeAsync(
            Buffer.of(...command),
            true,
          );
          await sleep(200);
        }
      }
      await peripheral.disconnectAsync();
    } finally {
      this.connectedDevice = undefined;
      await this.releaseLock(
        'BLEClient',
        'OnSendCommand',
        peripheralCommand.bleAddress,
      );
    }
  }

  async stopScanning() {
    if (this.isScanning) {
      this.isScanning = false;
      await noble.stopScanningAsync();
    }
  }

  async startScanning() {
    if (!this.isScanning && this.isOnline) {
      this.isScanning = true;
      await noble.startScanningAsync();
    }
  }

  async acquireLock(
    ...log: unknown[]
  ) {
    await this.lock.acquire();
    await this.stopScanning();
    this.log.info(
      'BLEClient',
      'AcquireLock',
      ...log,
    );
  }

  async releaseLock(
    ...log: string[]
  ) {
    this.log.info(
      'BLEClient',
      'ReleaseLock',
      ...log,
    );
    this.lock.release();
    await this.startScanning();
  }

  onDataCallback = (data: Buffer) => {
    this.log.info(
      'BLEClient',
      'OnDataCallback',
      data,
    );
    if (data.length > 0 && this.connectedDevice) {
      this.emit(
        new BLEPeripheralReceiveEvent(
          new BLEPeripheralStateReceive(
            this.connectedDevice.bleAddress,
            this.connectedDevice.deviceId,
            bufferToHex(data),
          ),
        ),
      );
    }
  };
}


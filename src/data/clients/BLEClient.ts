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

interface IdentifiedPeripheralCharacteristics extends IdentifiedPeripheral, ControlReportCharacteristics {
}

type BLEAddress = string;

@Injectable()
export class BLEClient
  extends GoveeClient {
  private static readonly STATE_POWERED_ON = 'poweredOn';
  private static readonly SERVICE_CONTROL_UUID = '000102030405060708090a0b0c0d1910';
  private static readonly CHARACTERISTIC_CONTROL_UUID = '000102030405060708090a0b0c0d2b11';
  private static readonly CHARACTERISTIC_REPORT_UUID = '000102030405060708090a0b0c0d2b10';

  private subscriptions: Map<BLEAddress, BLEDeviceIdentification> = new Map<BLEAddress, BLEDeviceIdentification>();
  private peripherals: Map<BLEAddress, Peripheral> = new Map<BLEAddress, Peripheral>();
  private identifiedPeripherals: Map<BLEAddress, IdentifiedPeripheral> = new Map<BLEAddress, IdentifiedPeripheral>();
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
        if (this.peripherals.has(peripheral.address.toLowerCase())) {
          return;
        }

        await this.tryDiscoverPeripheral(peripheral);
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
    if (!peripheral) {
      return;
    }
    await this.tryDiscoverPeripheral(peripheral);
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

    await this.lock(
      'BLEClient',
      'OnSendCommand',
      command.bleAddress,
    );
    await this.stopScanning();
    try {
      const identifiedPeripheralCharacteristics =
        await this.tryGetIdentifiedPeripheralCharacteristics(peripheralAddress);

      if (!identifiedPeripheralCharacteristics) {
        this.log.info(
          'BLEClient',
          'OnSendCommand',
          'No Identified Peripheral');
      } else {
        const {
          reportCharacteristic,
          controlCharacteristic,
        } = identifiedPeripheralCharacteristics;

        for (let i = 0; i < command.state.length; i++) {
          const state = command.state[i];
          reportCharacteristic.removeAllListeners();
          await reportCharacteristic.subscribeAsync();
          reportCharacteristic.on(
            'data',
            this.onDataCallback,
          );
          await controlCharacteristic.writeAsync(
            Buffer.of(...state),
            true,
          );
          await sleep(200);
        }
      }
    } finally {
      await this.startScanning();
      await this.release(
        'BLEClient',
        'OnSendCommand',
        command.bleAddress,
      );
    }
  }

  private async tryDiscoverPeripheral(
    peripheral: Peripheral,
  ): Promise<IdentifiedPeripheral | undefined> {
    let identifiedPeripheral: IdentifiedPeripheral | undefined = undefined;
    await this.lock(
      'BLEClient',
      'tryDiscoverPeripheral',
      peripheral.address.toLowerCase(),
    );
    await this.stopScanning();
    try {
      identifiedPeripheral = await this.tryGetIdentifiedPeripheral(peripheral);
    } finally {
      await this.startScanning();
      await this.release(
        'BLEClient',
        'tryDiscoverPeripheral',
        peripheral.address.toLowerCase(),
      );
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

  private async tryGetIdentifiedPeripheralCharacteristics(
    bleAddress: string,
  ): Promise<IdentifiedPeripheralCharacteristics | undefined> {
    if (!this.peripheralConnectionLock.isAcquired()) {
      this.log.info(
        'BLEClient',
        'tryGetIdentifiedPeripheralCharacteristics',
        'Lock is not acquired',
      );
    }
    const peripheralAddress = bleAddress.toLowerCase();
    const identifiedPeripheral = this.identifiedPeripherals.get(peripheralAddress);
    if (!identifiedPeripheral) {
      return undefined;
    }

    const peripheral = identifiedPeripheral.peripheral;
    const deviceIdentification = identifiedPeripheral.deviceIdentification;

    await peripheral.connectAsync();

    const controlReportCharacteristics = await this.tryGetCharacteristics(peripheral);

    if (!controlReportCharacteristics) {
      return undefined;
    }

    return {
      peripheral: peripheral,
      deviceIdentification: deviceIdentification,
      controlCharacteristic: controlReportCharacteristics.controlCharacteristic,
      reportCharacteristic: controlReportCharacteristics.reportCharacteristic,
    };
  }

  private async tryGetIdentifiedPeripheral(
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

  private async lock(...log: string[]) {
    await this.peripheralConnectionLock.acquire();
    this.log.info('BLEClient', 'AcquireLock', ...log);
  }

  private async release(...log: string[]) {
    this.log.info('BLEClient', 'ReleaseLock', ...log);
    this.peripheralConnectionLock.release();
  }

  private onDataCallback = (deviceIdentification: BLEDeviceIdentification) => (data: Buffer) => {
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
  };
}


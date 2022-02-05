import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Characteristic, Peripheral, Service} from '@abandonware/noble';
import {BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';
import {Emitter} from '../../util/types';
import {BLEPeripheralConnectionEvent, PeripheralConnectionState} from '../../core/events/dataClients/ble/BLEPeripheral';

@Injectable()
export class BLEClient
  extends GoveeClient {
  private static readonly STATE_POWERED_ON = 'poweredOn';

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
        this.devices.add(peripheral.address.toLocaleLowerCase());

        await noble.stopScanningAsync();
        this.log.info(
          'BLEClient',
          'peripheralAdvertisement',
          peripheral.advertisement,
        );
        await this.explorePeripheral(
          this.subscriptions[peripheral.address.toLowerCase()],
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
  onBLEDeviceSubscribe(bleDeviceId: BLEDeviceIdentification) {
    this.log.info('BLEClient', 'Subscribing', bleDeviceId.deviceId, bleDeviceId.bleAddress);
    this.subscriptions.set(bleDeviceId.bleAddress.toLocaleLowerCase(), bleDeviceId);
  }

  async explorePeripheral(
    deviceIdentification: BLEDeviceIdentification,
    peripheral: Peripheral,
  ) {
    peripheral.on(
      'disconnect',
      async (error?: string) => {
        if (error) {
          this.log.error(error);
          return;
        }

        await noble.startScanningAsync();
      },
    );

    const services = await peripheral.discoverServicesAsync([]);

    for (const service of services) {
      let serviceInfo = service.uuid;

      if (service.name) {
        serviceInfo += ` (${service.name})`;
      }

      this.log.info('BLEClient', 'peripheralService', serviceInfo);

      const characteristics = await service.discoverCharacteristicsAsync([]);

      for (const characteristic of characteristics) {
        let characteristicInfo = `  ${characteristic.uuid}`;

        if (characteristic.name) {
          characteristicInfo += ` (${characteristic.name})`;
        }

        const descriptors = await characteristic.discoverDescriptorsAsync();

        const userDescriptionDescriptor = descriptors.find((descriptor) => descriptor.uuid === '2901');

        if (userDescriptionDescriptor) {
          const data = await userDescriptionDescriptor.readValueAsync();
          if (data) {
            characteristicInfo += ` (${data.toString()})`;
          }
        }

        characteristicInfo += `\n    properties  ${characteristic.properties.join(', ')}`;

        if (characteristic.properties.includes('read')) {
          const data = await characteristic.readAsync();

          if (data) {
            const string = data.toString('ascii');

            characteristicInfo += `\n    value       ${data.toString('hex')} | '${string}'`;
          }
        }

        this.log.info('BLEClient', 'peripheralService', characteristicInfo);
      }
    }

    await peripheral.disconnectAsync();
  }

  @OnEvent(
    'BLE.PERIPHERAL.Connection',
    {
      async: true,
    },
  )
  onPeripheralConnection(connectionState: PeripheralConnectionState) {
    if (connectionState.connectionState === ConnectionState.Connected) {
      this.connections.set(connectionState.bleAddress.toLowerCase(), connectionState.connection);
    } else {
      this.connections.delete(connectionState.bleAddress.toLocaleLowerCase());
      if (!this.scanning) {
        noble.startScanning([], true);
      }
    }
  }
}

export class BLEPeripheralConnection
  extends Emitter {

  constructor(
    eventEmitter: EventEmitter2,
    private readonly deviceIdentification: BLEDeviceIdentification,
    private readonly peripheral: Peripheral,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
    peripheral.removeAllListeners();

    peripheral.on(
      'connect',
      this.onConnect,
    );

    // peripheral.on(
    //   'disconnect',
    //   this.onDisconnect,
    // );

    peripheral.on(
      'rssiUpdate',
      async (rssi: number) => this.log.info(rssi),
    );
  }

  onConnect(error?: string) {
    if (error) {
      this.log.info('TODO?');
      return;
    }
    this.emit(
      new BLEPeripheralConnectionEvent(
        new PeripheralConnectionState(
          this.deviceIdentification.bleAddress.toLowerCase(),
          this.deviceIdentification.deviceId,
          ConnectionState.Connected,
          this,
        ),
      ),
    );
  }

  onDisconnect(error?: string) {
    if (error) {
      this.log.info('TODO?');
      return;
    }
    this.emit(
      new BLEPeripheralConnectionEvent(
        new PeripheralConnectionState(
          this.deviceIdentification.bleAddress,
          this.deviceIdentification.deviceId,
          ConnectionState.Closed,
          this,
        ),
      ),
    );
  }

  async connect() {
    await this.peripheral.connectAsync();
    const services = await this.peripheral.discoverServicesAsync();
    this.log.info(this.peripheral.advertisement);
    for (let i = 0; i < services.length; i++) {
      await this.discoverServiceCharacteristics(services[i]);
    }
  }

  async discoverServiceCharacteristics(service: Service) {
    const characteristics = await service.discoverCharacteristicsAsync();
    for (let i = 0; i < characteristics.length; i++) {
      this.inspectCharacteristic(characteristics[i]);
    }
  }

  inspectCharacteristic(characteristic: Characteristic) {
    this.log.info(JSON.stringify(characteristic.properties));
    this.log.info(JSON.stringify(characteristic.descriptors));
  }
}
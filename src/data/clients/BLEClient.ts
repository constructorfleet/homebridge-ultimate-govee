import {GoveeClient} from './GoveeClient';
import {Injectable} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {ConnectionState} from '../../core/events/dataClients/DataClientEvent';
import {LoggingService} from '../../logging/LoggingService';
import noble, {Characteristic, Peripheral, Service} from '@abandonware/noble';
import {BLEDeviceIdentification} from '../../core/events/dataClients/ble/BLEEvent';

@Injectable()
export class BLEClient
  extends GoveeClient {
  private static readonly STATE_POWERED_ON = 'poweredOn';

  private subscriptions: Map<string, BLEDeviceIdentification> = new Map<string, BLEDeviceIdentification>();
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
        await noble.startScanningAsync();
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
    this.log.info('BLEClient', 'explorePeripheral', 'DiscoverServices');
    const services = await peripheral.discoverServicesAsync([]);

    for (const service of services) {
      let serviceInfo = service.uuid;

      if (service.name) {
        serviceInfo += ` (${service.name})`;
      }

      this.log.info('BLEClient', 'explorePeripheral ServiceInfo', serviceInfo);

      const characteristics = await service.discoverCharacteristicsAsync([]);

      for (const characteristic of characteristics) {
        let characteristicInfo = `  ${characteristic.uuid}`;

        if (characteristic.name) {
          characteristicInfo += ` (${characteristic.name})`;
        }

        this.log.info('BLEClient', 'explorePeripheral', 'DiscoverDescriptors');
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
}

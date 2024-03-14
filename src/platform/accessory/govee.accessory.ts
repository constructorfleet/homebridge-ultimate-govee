import {
  Device,
  DeviceStatesType,
  PartialBehaviorSubject,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { PlatformAccessory } from 'homebridge';
import { ConfigType } from '../../config';
import { Logger } from '@nestjs/common';

export class GoveeAccessory<States extends DeviceStatesType> {
  private readonly logger: Logger = new Logger(
    `${GoveeAccessory.name}-${this.device.name}`,
  );
  get deviceType(): string {
    return this.device.deviceType;
  }

  constructor(
    readonly device: Device<States>,
    readonly accessory: PlatformAccessory,
    readonly deviceConfig: PartialBehaviorSubject<ConfigType<States>>,
  ) {
    this.setupInformationService();
  }

  private setupInformationService() {
    const service = this.accessory.getService(Service.AccessoryInformation);
    if (service === undefined) {
      return;
    }
    const config = this.deviceConfig.getValue();

    if (config.name !== undefined) {
      service?.getCharacteristic(Characteristic.Name)?.updateValue(config.name);
      service
        ?.getCharacteristic(Characteristic.ConfiguredName)
        ?.updateValue(config.name);
    }
    service
      ?.getCharacteristic(Characteristic.Manufacturer)
      ?.updateValue('Govee');
    service
      ?.getCharacteristic(Characteristic.Model)
      ?.updateValue(this.device.model);
    service
      ?.getCharacteristic(Characteristic.SerialNumber)
      ?.setValue(this.device.id);
    if (this.device.version?.hardwareVersion !== undefined) {
      service
        ?.getCharacteristic(Characteristic.FirmwareRevision)
        ?.updateValue(this.device.version.hardwareVersion);
    }
    if (this.device.version?.softwareVersion !== undefined) {
      service
        ?.getCharacteristic(Characteristic.SoftwareRevision)
        ?.updateValue(this.device.version.softwareVersion);
    }
  }
}

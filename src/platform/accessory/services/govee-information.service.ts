import {
  AirQualityDevice,
  Device,
  HumidifierDevice,
  IceMakerDevice,
  PurifierDevice,
  HygrometerDevice,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { GoveeService } from './govee-service';
import { Service, Characteristic } from 'hap-nodejs';
import { ServiceRegistry } from './services.registry';

@ServiceRegistry.register(
  AirQualityDevice,
  HumidifierDevice,
  IceMakerDevice,
  PurifierDevice,
  HygrometerDevice,
  RGBICLightDevice,
  RGBLightDevice,
  Device,
)
export class GoveeInformationService extends GoveeService(
  Service.AccessoryInformation,
) {
  static readonly UUID = Service.AccessoryInformation.UUID;
  readonly UUID = Service.AccessoryInformation.UUID;

  constructor(device: Device) {
    super(device);
    this.update(device);
  }

  update(device: Device) {
    const [
      charManufacturer,
      charModel,
      charName,
      charConfigName,
      charSerial,
      charHardVersion,
      charSoftVersion,
    ] = [
      this.getCharacteristic(Characteristic.Manufacturer),
      this.getCharacteristic(Characteristic.Model),
      this.getCharacteristic(Characteristic.Name),
      this.getCharacteristic(Characteristic.ConfiguredName),
      this.getCharacteristic(Characteristic.SerialNumber),
      this.getCharacteristic(Characteristic.HardwareRevision),
      this.getCharacteristic(Characteristic.SoftwareRevision),
    ];
    charManufacturer.updateValue('Govee');
    if (device.model !== undefined) {
      charModel.updateValue(device.model);
    }
    if (device.name !== undefined) {
      charName.updateValue(device.name);
      charConfigName.updateValue(device.name);
    }
    charSerial.updateValue(device.id);
    if (device.device.version.hardwareVersion !== undefined) {
      charHardVersion.updateValue(device.device.version.hardwareVersion);
    }
    if (device.device.version.softwareVersion !== undefined) {
      charSoftVersion.updateValue(device.device.version.softwareVersion);
    }
  }
}

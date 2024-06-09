import { Device, DeviceStatesType } from '@constructorfleet/ultimate-govee';
import { Logger } from '@nestjs/common';
import { Characteristic, Service } from 'hap-nodejs';
import { PlatformAccessory } from 'homebridge';
import {
  ConfigType,
  DiyEffectConfig,
  LightEffectConfig,
  RGBLightDeviceConfig,
} from '../../config';

export class GoveeAccessoryEffect {
  private logger: Logger;
  private effectname: string = '';

  get name(): string {
    return this.effectname;
  }

  set name(name: string) {
    if (this.effectName === name) {
      return;
    }
    this.effectName = name;
    this.accessory.accessory
      .getServiceById(Service.Switch, this.code.toString())
      ?.getCharacteristic(Characteristic.Name)
      ?.updateValue(
        `${this.accessory.name} ${this.name} ${this.effectType} Effect`,
      );
  }

  get isExposed(): boolean {
    return this.exposed;
  }

  set isExposed(exposed: boolean) {
    if (this.exposed === exposed) {
      return;
    }
    this.exposed = exposed;
  }

  constructor(
    readonly code: number,
    private effectType: 'light' | 'diy',
    private effectName: string,
    private exposed: boolean,
    private readonly accessory: GoveeAccessory<any>,
  ) {
    this.logger = new Logger(`${accessory.id}-${this.name}`);
  }
}

export class GoveeAccessory<States extends DeviceStatesType> {
  private logger?: Logger;
  private ignore: boolean = false;
  private debug: boolean = false;
  private enablePrevious: boolean = false;
  private showSegments: boolean = false;
  readonly lightEffects: Map<number, GoveeAccessoryEffect> = new Map();
  readonly diyEffects: Map<number, GoveeAccessoryEffect> = new Map();

  get id(): string {
    return this.device.id;
  }

  get deviceType(): string {
    return this.device.deviceType;
  }

  get name(): string {
    return (this.accessory
      .getService(Service.AccessoryInformation)
      ?.getCharacteristic(Characteristic.ConfiguredName)?.value ??
      this.device.name) as string;
  }

  set name(name: string) {
    const nameChar = this.accessory
      .getService(Service.AccessoryInformation)
      ?.getCharacteristic(Characteristic.ConfiguredName);

    if (nameChar?.value !== name) {
      nameChar?.updateValue(name);
      Logger.flush();
      this.logger = new Logger(`${GoveeAccessory.name}-${name}`);
      this.logger.log(`Device name is now ${name}`);
    }
  }

  get isIgnored(): boolean {
    return this.ignore;
  }

  set isIgnored(ignore: boolean) {
    if (this.isIgnored === ignore) {
      return;
    }
    this.ignore = ignore;
    this.logger?.log(`Ignoring device ${ignore ? 'enabled' : 'disabled'}`);
  }

  get isDebugging(): boolean {
    return this.debug;
  }

  set isDebugging(debug: boolean) {
    if (this.debug === debug) {
      return;
    }
    this.debug = debug;
    this.device.debug(debug);
    this.logger?.log(`Debugging ${debug ? 'enabled' : 'disabled'}`);
  }

  get exposePreviousButton(): boolean {
    return this.enablePrevious;
  }

  set exposePreviousButton(exposePrevious: boolean) {
    if (this.exposePreviousButton === exposePrevious) {
      return;
    }
    this.enablePrevious = exposePrevious;
    this.logger?.log(
      `Previous button ${exposePrevious ? 'enabled' : 'disabled'}`,
    );
  }

  get shouldShowSegments(): boolean {
    return this.showSegments;
  }

  set shouldShowSegments(showSegments: boolean) {
    if (this.showSegments === showSegments) {
      return;
    }
    this.showSegments = showSegments;
  }

  addLightEffect(effect: LightEffectConfig) {
    if (this.lightEffects.has(effect.code)) {
      return;
    }
    this.lightEffects.set(
      effect.code,
      new GoveeAccessoryEffect(
        effect.code,
        'light',
        effect.name,
        effect.enabled,
        this,
      ),
    );
  }

  removeLightEffect(code: number) {
    this.lightEffects.delete(code);
  }

  addDiyEffect(effect: DiyEffectConfig) {
    if (this.diyEffects.has(effect.code)) {
      return;
    }
    this.diyEffects.set(
      effect.code,
      new GoveeAccessoryEffect(
        effect.code,
        'diy',
        effect.name,
        effect.enabled,
        this,
      ),
    );
  }

  removeDiyEffect(code: number) {
    this.diyEffects.delete(code);
  }

  constructor(
    readonly device: Device<States>,
    readonly accessory: PlatformAccessory,
    deviceConfig: ConfigType<States>,
  ) {
    this.setupInformationService(deviceConfig);
  }

  private setupInformationService(config: ConfigType<States>) {
    const service = this.accessory.getService(Service.AccessoryInformation);
    if (service === undefined) {
      return;
    }

    this.name = config.name ?? this.device.name;
    this.debug = config.debug === true;
    this.exposePreviousButton = config.exposePrevious === true;
    this.ignore = config.ignore === true;

    if (config instanceof RGBLightDeviceConfig) {
      Object.values(config.effects).forEach((effect) => {
        if (effect.code === undefined || effect.name === undefined) {
          return;
        }
        this.lightEffects.set(
          effect.code,
          new GoveeAccessoryEffect(
            effect.code,
            'light',
            effect.name,
            effect.enabled,
            this,
          ),
        );
      });
      Object.values(config.diy).forEach((effect) => {
        if (effect.code === undefined || effect.name === undefined) {
          return;
        }
        this.diyEffects.set(
          effect.code,
          new GoveeAccessoryEffect(
            effect.code,
            'diy',
            effect.name,
            effect.enabled,
            this,
          ),
        );
      });
    }

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

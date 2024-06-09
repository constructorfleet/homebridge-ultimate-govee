import { Device, DeviceStatesType } from '@constructorfleet/ultimate-govee';
import { Logger } from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Characteristic, Service } from 'hap-nodejs';
import { PlatformAccessory } from 'homebridge';
import { using } from '../../common';
import {
  ConfigType,
  DeviceConfig,
  DiyEffectConfig,
  LightEffectConfig,
  PluginDeviceConfig,
  RGBICLightDeviceConfig,
  RGBLightDeviceConfig,
} from '../../config';

export type AccessoryContext = {
  initialized: Record<string, boolean>;
  deviceConfig: PluginDeviceConfig;
};

export type GoveePlatformAccessory = PlatformAccessory<AccessoryContext>;

export class GoveeAccessoryEffect {
  private logger: Logger;

  get name(): string {
    return this.effectName;
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
  static parseConfig(
    deviceConfig: PluginDeviceConfig,
  ): ConfigType<DeviceStatesType> {
    switch (deviceConfig._type) {
      case 'rgbic':
        return plainToInstance(RGBICLightDeviceConfig, deviceConfig);
      case 'rgb':
        return plainToInstance(RGBLightDeviceConfig, deviceConfig);
      default:
        return plainToInstance(DeviceConfig, deviceConfig);
    }
  }

  private logger?: Logger;
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
    return this.deviceConfig.ignore;
  }

  set isIgnored(ignore: boolean) {
    if (this.isIgnored === ignore) {
      return;
    }
    this.deviceConfig = using(this.deviceConfig).do((deviceConfig) => {
      deviceConfig.ignore = ignore;
    });
    this.logger?.log(`Ignoring device ${ignore ? 'enabled' : 'disabled'}`);
  }

  get isDebugging(): boolean {
    return this.deviceConfig.debug;
  }

  set isDebugging(debug: boolean) {
    if (this.isDebugging === debug) {
      return;
    }
    this.device.debug(debug);
    this.deviceConfig = using(this.deviceConfig).do((deviceConfig) => {
      deviceConfig.debug = debug;
    });
    this.logger?.log(`Debugging ${debug ? 'enabled' : 'disabled'}`);
  }

  get exposePreviousButton(): boolean {
    return this.deviceConfig.exposePrevious;
  }

  set exposePreviousButton(exposePrevious: boolean) {
    if (this.exposePreviousButton === exposePrevious) {
      return;
    }
    this.deviceConfig = using(this.deviceConfig).do((deviceConfig) => {
      deviceConfig.exposePrevious = exposePrevious;
    });
    this.logger?.log(
      `Previous button ${exposePrevious ? 'enabled' : 'disabled'}`,
    );
  }

  get shouldShowSegments(): boolean {
    return (this.deviceConfig as RGBICLightDeviceConfig)?.showSegments === true;
  }

  set shouldShowSegments(showSegments: boolean) {
    if (this.shouldShowSegments === showSegments) {
      return;
    }

    if (this.deviceConfig instanceof RGBICLightDeviceConfig) {
      const deviceConfig: RGBICLightDeviceConfig = this
        .deviceConfig as RGBICLightDeviceConfig;
      deviceConfig.showSegments = showSegments;
      this.deviceConfig = deviceConfig;
    }
  }

  addLightEffect(effect: LightEffectConfig): boolean {
    if (this.lightEffects.has(effect.code)) {
      return false;
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
    return true;
  }

  removeLightEffect(code: number): boolean {
    if (!this.lightEffects.has(code)) {
      return false;
    }
    this.lightEffects.delete(code);
    return true;
  }

  addDiyEffect(effect: DiyEffectConfig): boolean {
    if (this.diyEffects.has(effect.code)) {
      return false;
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
    return true;
  }

  removeDiyEffect(code: number): boolean {
    if (!this.diyEffects.has(code)) {
      return false;
    }
    this.diyEffects.delete(code);
    return true;
  }

  set deviceConfig(deviceConfig: ConfigType<States>) {
    this.exposePreviousButton = deviceConfig.exposePrevious;
    this.isIgnored = deviceConfig.ignore;
    this.isDebugging = deviceConfig.debug;
    if (deviceConfig instanceof RGBICLightDeviceConfig) {
      this.shouldShowSegments = deviceConfig.showSegments;
    }
    this.accessory.context = {
      initialized: this.accessory.context.initialized ?? {},
      deviceConfig: instanceToPlain(deviceConfig) as PluginDeviceConfig,
    };
  }

  get deviceConfig(): ConfigType<States> {
    const config = GoveeAccessory.parseConfig(
      this.accessory.context.deviceConfig,
    );
    return config;
  }

  isServiceInitialized(serviceKey: string): boolean {
    return (
      !!this.accessory.context.initialized &&
      this.accessory.context.initialized[serviceKey]
    );
  }

  serviceInitialized(serviceKey: string, isInitialized: boolean = true) {
    this.accessory.context = {
      initialized: {
        ...(this.accessory.context.initialized ?? {}),
        [serviceKey]: isInitialized,
      },
      deviceConfig: this.accessory.context.deviceConfig,
    };
  }

  constructor(
    readonly device: Device<States>,
    readonly accessory: GoveePlatformAccessory,
    deviceConfig: ConfigType<States>,
  ) {
    this.setup(deviceConfig);
  }

  setup(config: ConfigType<States>) {
    this.deviceConfig = config;
    const service = this.accessory.getService(Service.AccessoryInformation);
    if (service === undefined) {
      return;
    }

    this.name = config.name ?? this.device.name;

    if (config instanceof RGBLightDeviceConfig) {
      Array.from(this.lightEffects?.values() ?? [])
        .filter((effect) => !config.effects[effect.code])
        .forEach((effect) => this.removeLightEffect(effect.code));
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
      Array.from(this.diyEffects?.values() ?? [])
        .filter((effect) => !config.diy[effect.code])
        .forEach((effect) => this.removeDiyEffect(effect.code));
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

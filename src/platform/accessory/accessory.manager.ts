import { Injectable } from '@nestjs/common';
import { API, Categories, PlatformAccessory } from 'homebridge';
import {
  AirQualityDevice,
  Device,
  HumidifierDevice,
  HygrometerDevice,
  PurifierDevice,
  RGBICLightDevice,
  RGBLightDevice,
} from '@constructorfleet/ultimate-govee';
import { BinaryLike } from 'crypto';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { PluginConfigService } from '../../config/plugin-config.service';
import { LoggingService } from '../../logger/logger.service';
import { Lock } from 'async-await-mutex-lock';
import { HandlerRegistry } from './handlers';
import { Subscription } from 'rxjs';
import { InjectHomebridgeApi, InjectUUID } from './accessory.const';
import { GoveeAccessory } from './govee.accessory';

const categoryMap = {
  [HumidifierDevice.deviceType]: Categories.AIR_HUMIDIFIER,
  [PurifierDevice.deviceType]: Categories.AIR_PURIFIER,
  [AirQualityDevice.deviceType]: Categories.SENSOR,
  [HygrometerDevice.deviceType]: Categories.SENSOR,
  [RGBICLightDevice.deviceType]: Categories.LIGHTBULB,
  [RGBLightDevice.deviceType]: Categories.LIGHTBULB,
};

@Injectable()
export class AccessoryManager {
  private lock: Lock<void> = new Lock();
  private readonly accessories: Map<string, PlatformAccessory> = new Map<
    string,
    PlatformAccessory
  >();
  private readonly goveeAccessories: GoveeAccessory<any>[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly handlerRegistry: HandlerRegistry,
    private readonly logger: LoggingService,
    private readonly configService: PluginConfigService,
    @InjectHomebridgeApi private readonly api: API,
    @InjectUUID
    private readonly uuid: (data: BinaryLike) => string,
  ) {}

  onAccessoryLoaded(accessory: PlatformAccessory) {
    accessory.context.initialized = {};
    this.accessories.set(accessory.UUID, accessory);
    this.logger.info(`Loaded ${accessory.displayName} from cache`);
  }

  async onDeviceDiscovered(device: Device) {
    this.logger.info(`Discovered Device ${device.id}`);
    const uuid = this.uuid(device.id);
    const accessory: PlatformAccessory =
      this.accessories.get(uuid) ??
      new this.api.platformAccessory(
        device.name,
        uuid,
        categoryMap[device.deviceType],
      );
    if (!this.accessories.has(uuid)) {
      this.logger.info(`Registering new accessory for ${device.id}`);
      this.accessories.set(device.id, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    }

    if (device instanceof RGBICLightDevice) {
      let interval: NodeJS.Timeout | undefined = undefined;
      let iterations: number = 0;
      await new Promise<void>((resolve) => {
        interval = setInterval(() => {
          if (
            ((device as RGBICLightDevice).lightEffect?.effects?.size ?? 0) >=
              0 ||
            iterations++ > 5
          ) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    }

    const goveeAccessory = new GoveeAccessory(
      device,
      accessory,
      await this.configService.getDeviceConfiguration(device),
    );

    accessory.context.device = this.getSafeDeviceModel(device);
    this.subscriptions.push(
      goveeAccessory.deviceConfig.subscribe(async () => {
        await this.handlerRegistry.updateAccessoryHandlers(goveeAccessory);
      }),
    );

    this.api.updatePlatformAccessories([goveeAccessory.accessory]);
  }

  private getSafeDeviceModel(device: Device) {
    const deviceModel = device.device;

    if (!deviceModel) {
      return undefined;
    }
    return {
      ...deviceModel,
      status: deviceModel.status.getValue(),
    };
  }
}

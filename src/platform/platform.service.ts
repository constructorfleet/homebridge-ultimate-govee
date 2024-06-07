import { UltimateGoveeService } from '@constructorfleet/ultimate-govee';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subscription, map } from 'rxjs';
import { PluginConfigService } from '../config';
import { LoggingService } from '../logger/logger.service';
import { AccessoryManager } from './accessory/accessory.manager';
import { GoveePlatformAccessory } from './accessory/govee.accessory';

@Injectable()
export class PlatformService implements OnModuleDestroy {
  private channelSubscriptions: Record<string, Subscription> = {};
  constructor(
    private readonly logger: LoggingService,
    private readonly configService: PluginConfigService,
    private readonly service: UltimateGoveeService,
    private readonly accessoryManager: AccessoryManager,
  ) {}

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: GoveePlatformAccessory) {
    this.accessoryManager.onAccessoryLoaded(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.logger.info('Discovering devices');
    this.service.deviceDiscovered
      .pipe(map((event) => event.device))
      .subscribe(async (device) => {
        await this.accessoryManager.onDeviceDiscovered(device);
      });
    this.logger.info('Connecting', this.configService.pluginConfig);
    const credentials = this.configService.pluginConfig.credentials;
    if (
      credentials?.username === undefined ||
      credentials?.password === undefined
    ) {
      return;
    }
    this.service.connect(credentials.username, credentials.password);

    const controlChannels = this.configService.pluginConfig.controlChannels;
    if (
      controlChannels !== undefined &&
      controlChannels.ble !== undefined &&
      controlChannels.iot !== undefined
    ) {
      this.service.channel('ble').setEnabled(controlChannels.ble);
      this.service.channel('iot').setEnabled(controlChannels.iot);
    }
  }

  onModuleDestroy() {
    Object.values(this.channelSubscriptions).forEach((sub) =>
      sub.unsubscribe(),
    );
  }
}

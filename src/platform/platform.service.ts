import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PlatformAccessory } from 'homebridge';
import { AccessoryManager } from './accessory/accessory.manager';
import { InjectConfig } from '../config/plugin-config.providers';
import { GoveePluginConfig } from '../config/v2/plugin-config.govee';
import {
  PartialBehaviorSubject,
  UltimateGoveeService,
} from '@constructorfleet/ultimate-govee';
import { Subscription, filter, map } from 'rxjs';
import { LoggingService } from '../logger/logger.service';

@Injectable()
export class PlatformService implements OnModuleDestroy {
  private channelSubscriptions: Record<string, Subscription> = {};
  constructor(
    private readonly logger: LoggingService,
    @InjectConfig
    private readonly config: PartialBehaviorSubject<GoveePluginConfig>,
    private readonly service: UltimateGoveeService,
    private readonly accessoryManager: AccessoryManager,
  ) {}

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.accessoryManager.onAccessoryLoaded(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.service.deviceDiscovered
      .pipe(map((event) => event.device))
      .subscribe(async (device) => {
        await this.accessoryManager.onDeviceDiscovered(device);
      });
    let connected = false;
    this.config
      .pipe(
        filter((config) => config !== undefined),
        map((config) => config!),
      )
      .subscribe((config) => {
        const controlChannels = config.controlChannels;
        if (controlChannels !== undefined) {
          if (
            !this.channelSubscriptions['ble'] &&
            controlChannels.ble.subscribe !== undefined
          ) {
            this.channelSubscriptions['ble'] = controlChannels.ble.subscribe(
              (enabled) => {
                this.service.channel('ble').setEnabled(enabled);
              },
            );
          }
          if (
            !this.channelSubscriptions['iot'] &&
            controlChannels.iot.subscribe !== undefined
          ) {
            this.channelSubscriptions['iot'] = controlChannels.iot.subscribe(
              (enabled) => {
                this.service.channel('iot').setEnabled(enabled);
              },
            );
          }
        }
        if (connected) {
          return;
        }
        const credentials = config?.credentials;
        if (
          credentials?.username === undefined ||
          credentials?.password === undefined
        ) {
          return;
        }
        connected = true;
        this.service.connect(credentials.username, credentials.password);
      });
  }

  onModuleDestroy() {
    Object.values(this.channelSubscriptions).forEach((sub) =>
      sub.unsubscribe(),
    );
  }
}

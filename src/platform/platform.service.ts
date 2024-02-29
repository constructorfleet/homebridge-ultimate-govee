import { Injectable } from '@nestjs/common';
import { API, PlatformAccessory } from 'homebridge';
import { AccessoryManager } from './accessory/accessory.manager';
import { InjectHomebridgeApi } from '../core';
import { InjectConfig } from '../config/plugin-config.providers';
import { GoveePluginConfig } from '../config/v2/plugin-config.govee';
import { PartialBehaviorSubject } from '../common';
import { UltimateGoveeService } from '@constructorfleet/ultimate-govee';
import { map } from 'rxjs';
import { LoggingService } from '../logger/logger.service';

@Injectable()
export class PlatformService {
  constructor(
    @InjectHomebridgeApi private readonly api: API,
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
    this.accessoryManager.onAccessoryLoaded(
      accessory,
      // this.service.constructDevice({
      //   ...deviceModel,
      //   status: new BehaviorSubject(deviceModel.status),
      // }),
    );
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    this.service.deviceDiscovered
      .pipe(map((event) => event.device))
      .subscribe(async (device) => {
        await this.accessoryManager.onDeviceDiscovered(device);
      });
    const controlChannels = this.config.getValue()?.controlChannels;
    if (controlChannels !== undefined) {
      this.service.channel('ble').setEnabled(controlChannels.ble);
      this.service.channel('iot').setEnabled(controlChannels.iot);
    }

    const credentials = this.config.getValue()?.credentials;
    if (
      credentials?.username === undefined ||
      credentials?.password === undefined
    ) {
      return;
    }
    await this.service.connect(credentials.username, credentials.password);
  }
}

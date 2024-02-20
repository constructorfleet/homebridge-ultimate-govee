import { Inject, Injectable } from '@nestjs/common';
import { HOMEBRIDGE_API } from '../util/const';
import { API, PlatformAccessory } from 'homebridge';
import { AccessoryManager } from './accessory/accessory.manager';
import { LoggingService } from '../logger/logger.service';

@Injectable()
export class PlatformService {
  constructor(
    @Inject(HOMEBRIDGE_API) private readonly api: API,

    private readonly accessoryManager: AccessoryManager,
    private readonly log: LoggingService,
  ) {}

  async handleFeatureFlags() {
    // const processHandler = (handler: BaseFeatureHandler) => handler.process();
    await Promise.resolve();
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  async configureAccessory(accessory: PlatformAccessory) {
    // add the restored accessory to the accessories cache so we can track if it has already been registered
    await this.accessoryManager.onAccessoryLoaded(accessory);
  }

  updateAccessory(accessory: PlatformAccessory) {
    this.api.updatePlatformAccessories([accessory]);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    // await this.emitAsync(new RestRequestDevices());
  }
}

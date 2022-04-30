import {Inject, Injectable} from '@nestjs/common';
import {HOMEBRIDGE_API} from '../util/const';
import {API, PlatformAccessory} from 'homebridge';
import {Emitter} from '../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {AccessoryManager} from './accessories/AccessoryManager';
import {LoggingService} from '../logging/LoggingService';
import {RestRequestDevices} from '../core/events/dataClients/rest/RestRequest';
import {Features} from './config/Features';
import {BaseFeatureHandler} from './config/features/BaseFeatureHandler';

@Injectable()
export class PlatformService extends Emitter {

  constructor(
    eventEmitter: EventEmitter2,
    @Inject(HOMEBRIDGE_API) private readonly api: API,
    @Inject(Features) private readonly getFeatureHandlers: () => Promise<BaseFeatureHandler[]>,
    private readonly accessoryManager: AccessoryManager,
    private readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  async handleFeatureFlags() {
    const processHandler = (handler: BaseFeatureHandler) => handler.process();
    const featureHandlers = await this.getFeatureHandlers();
    await Promise.all(featureHandlers.map(processHandler));
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
    await this.emitAsync(
      new RestRequestDevices(),
    );
  }
}
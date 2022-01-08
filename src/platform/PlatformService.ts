import {Inject, Injectable} from '@nestjs/common';
import {GOVEE_CLIENT_ID, GOVEE_PASSWORD, GOVEE_USERNAME, PLATFORM_LOGGER} from '../util/const';
import {PlatformAccessory} from 'homebridge';
import {Emitter} from '../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {RestAuthenticateEvent} from '../core/events/dataClients/rest/RestAuthentication';
import {AccessoryManager} from './accessories/AccessoryManager';
import {Logging} from 'homebridge/lib/logger';

@Injectable()
export class PlatformService extends Emitter {

  constructor(
    eventEmitter: EventEmitter2,
    private readonly accessoryManager: AccessoryManager,
    @Inject(PLATFORM_LOGGER) private readonly log: Logging,
    @Inject(GOVEE_USERNAME) private readonly goveeUsername: string,
    @Inject(GOVEE_PASSWORD) private readonly goveePassword: string,
    @Inject(GOVEE_CLIENT_ID) private readonly goveeClientId: string,
  ) {
    super(eventEmitter);
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    // this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.emit(
      new RestAuthenticateEvent(
        {
          username: this.goveeUsername,
          password: this.goveePassword,
          clientId: this.goveeClientId,
        },
      ),
    );
    // const eventEmitter = this.context.get(EventEmitter2);
    // eventEmitter
    //   .on(
    //     'DEVICE.Discovered',
    //     this.onDeviceDiscovered,
    //     {
    //       async: true,
    //     },
    //   );
    // eventEmitter
    //   .emit(
    //     event.eventName,
    //     event.eventData,
    //   );
    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud states
    // or a user-defined array in the platform config.
    // const exampleDevices = [
    //   {
    //     exampleUniqueId: 'ABCD',
    //     exampleDisplayName: 'Bedroom',
    //   },
    //   {
    //     exampleUniqueId: 'EFGH',
    //     exampleDisplayName: 'Kitchen',
    //   },
    // ];
    //
    // // loop over the discovered devices and register each one if it has not already been registered
    // for (const device of exampleDevices) {
    //
    //   // generate a unique id for the accessory this should be generated from
    //   // something globally unique, but constant, for example, the device serial
    //   // number or MAC address
    //   const uuid = this.api.hap.uuid.generate(device.exampleUniqueId);
    //
    //   // see if an accessory with the same uuid has already been registered and restored from
    //   // the cached devices we stored in the `configureAccessory` method above
    //   const existingAccessory = this.accessories.find(
    //     accessory => accessory.UUID === uuid);
    //
    //   if (existingAccessory) {
    //     // the accessory already exists
    //     this.log.info('Restoring existing accessory from cache:',
    //       existingAccessory.displayName);
    //
    //     // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
    //     // existingAccessory.context.device = device;
    //     // this.api.updatePlatformAccessories([existingAccessory]);
    //
    //     // create the accessory handler for the restored accessory
    //     // this is imported from `platformAccessory.ts`
    //     new ExamplePlatformAccessory(this, existingAccessory);
    //
    //     // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
    //     // remove platform accessories when no longer present
    //     // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
    //     // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
    //   } else {
    //     // the accessory does not yet exist, so we need to create it
    //     this.log.info('Adding new accessory:', device.exampleDisplayName);
    //
    //     // create a new accessory
    //     const accessory = new this.api.platformAccessory(
    //       device.exampleDisplayName, uuid);
    //
    //     // store a copy of the device object in the `accessory.context`
    //     // the `context` property can be used to store any data about the accessory you may need
    //     accessory.context.device = device;
    //
    //     // create the accessory handler for the newly create accessory
    //     // this is imported from `platformAccessory.ts`
    //     new ExamplePlatformAccessory(this, accessory);
    //
    //     // link the accessory to your platform
    //     this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME,
    //       [accessory]);
    //   }
    // }
  }
}
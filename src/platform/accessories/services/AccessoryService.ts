import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {LoggingService} from '../../../logging/LoggingService';

export abstract class AccessoryService extends Emitter {
  protected abstract readonly ServiceType: WithUUID<typeof Service>;

  protected constructor(
    eventEmitter: EventEmitter2,
    protected readonly SERVICES: typeof Service,
    protected readonly CHARACTERISTICS: typeof Characteristic,
    protected readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  public initializeAccessory(
    accessory: PlatformAccessory,
    device: GoveeDevice,
  ): PlatformAccessory {
    if (!this.supports(device)) {
      return accessory;
    }

    if (!accessory.context.device) {
      accessory.context.device = device;
    }

    const service = this.get(accessory);
    this.initializeServiceCharacteristics(
      service,
      device,
    );
    this.updateServiceCharacteristics(
      service,
      device,
    );
    return accessory;
  }

  public updateAccessory(
    accessory: PlatformAccessory,
    device: GoveeDevice,
  ): PlatformAccessory {
    if (!this.supports(device)) {
      return accessory;
    }
    this.updateServiceCharacteristics(
      this.get(accessory),
      device,
    );
    return accessory;
  }

  protected supports(device: GoveeDevice): boolean {
    return true;
  }

  protected updateServiceCharacteristics(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    service: Service,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    device: GoveeDevice,
  ) {
  }

  protected abstract initializeServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  );

  protected get(
    accessory: PlatformAccessory,
  ): Service {
    return accessory.getService(this.ServiceType) || accessory.addService(this.ServiceType);
  }
}
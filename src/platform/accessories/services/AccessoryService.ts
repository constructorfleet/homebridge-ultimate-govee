import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {LoggingService} from '../../../logging/LoggingService';

export abstract class AccessoryService extends Emitter {
  protected abstract readonly serviceType: WithUUID<typeof Service>;
  protected readonly subTypes?: string[] = undefined;
  protected readonly isPrimary?: boolean = undefined;

  protected constructor(
    eventEmitter: EventEmitter2,
    protected readonly SERVICES: typeof Service,
    protected readonly CHARACTERISTICS: typeof Characteristic,
    protected readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  public updateAccessory(
    accessory: PlatformAccessory,
    device: GoveeDevice,
  ): PlatformAccessory {
    if (!this.supports(device)) {
      return accessory;
    }
    this.get(accessory).forEach(
      (service) =>
        this.updateServiceCharacteristics(
          service,
          device,
        ),
    );
    accessory.context.device = device;
    return accessory;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected supports(device: GoveeDevice): boolean {
    return true;
  }

  protected abstract updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  );

  protected get(
    accessory: PlatformAccessory,
  ): Service[] {
    if (!this.subTypes || this.subTypes.length === 0) {
      return [this.getService(accessory)];
    }
    return this.subTypes.map(
      (subType) => this.getSubTypeService(
        accessory,
        subType,
      ),
    );
  }

  private getService(
    accessory: PlatformAccessory,
  ): Service {
    return this.setServicePrimary(
      accessory.getService(
        this.serviceType,
      ) || accessory.addService(this.serviceType),
    );
  }

  private getSubTypeService(
    accessory: PlatformAccessory,
    subType: string,
  ): Service {
    return this.setServicePrimary(
      accessory.getServiceById(
        this.serviceType,
        subType,
      ) || accessory.addService(
        this.serviceType,
        subType,
        subType,
      ),
    );
  }

  private setServicePrimary(
    service: Service,
  ): Service {
    if (service.isPrimaryService !== this.isPrimary) {
      service.setPrimaryService(this.isPrimary);
    }

    return service;
  }
}
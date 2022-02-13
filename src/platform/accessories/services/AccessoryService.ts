import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {LoggingService} from '../../../logging/LoggingService';

export abstract class AccessoryService extends Emitter {
  protected abstract readonly ServiceType: WithUUID<typeof Service>;
  protected readonly ServiceSubTypes?: string[];

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
    if (!this.ServiceSubTypes || this.ServiceSubTypes?.length === 0) {
      const service = accessory.getService(this.ServiceType) || accessory.addService(this.ServiceType, accessory.displayName, 'Primary');

      if (!service.isPrimaryService) {
        service.setPrimaryService(true);
      }
      return [service];
    }

    return this.ServiceSubTypes.map(
      (subType) => accessory.getServiceById(this.ServiceType, subType)
        || accessory.addService(
          this.ServiceType,
          `${accessory.displayName} ${subType}`,
          subType,
        ),
    );

  }
}
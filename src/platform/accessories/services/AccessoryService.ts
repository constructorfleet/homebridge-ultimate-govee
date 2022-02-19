import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {LoggingService} from '../../../logging/LoggingService';
import {PlatformConfigService} from '../../config/PlatformConfigService';

export class ServiceSubType<IdentifierType> {
  constructor(
    public readonly subType: string,
    public readonly identifier?: IdentifierType,
    public readonly nameSuffix?: string,
    public readonly primary?: boolean,
    public readonly linkToPrimary?: boolean,
  ) {
  }
}

export interface IdentifiedService<IdentifierType> {
  service: Service;
  identifier?: IdentifierType;
  subType?: ServiceSubType<IdentifierType>;
}

export abstract class AccessoryService<IdentifierType> extends Emitter {
  private static setServicePrimary(
    accessory: PlatformAccessory,
    service: Service,
    primary?: boolean,
    linkToPrimary?: boolean,
  ): Service {
    if (service.isPrimaryService !== primary) {
      service.setPrimaryService(primary);
    }

    if (linkToPrimary) {
      accessory.services.find(
        (service) => service.isPrimaryService,
      )?.addLinkedService(service);
    }

    return service;
  }

  protected abstract readonly serviceType: WithUUID<typeof Service>;
  protected readonly subTypes?: ServiceSubType<IdentifierType>[] = undefined;

  protected constructor(
    eventEmitter: EventEmitter2,
    protected readonly configService: PlatformConfigService,
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
      (identifiedService: IdentifiedService<IdentifierType>) =>
        this.processDeviceOverrides(
          device,
          accessory,
          identifiedService,
        ).then(
          (identifiedService: IdentifiedService<IdentifierType> | undefined) => {
            if (identifiedService) {
              this.updateServiceCharacteristics(
                identifiedService.service,
                device,
                identifiedService.identifier,
              );
            }
          },
        ),
    );
    return accessory;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected supports(device: GoveeDevice): boolean {
    return true;
  }

  protected async processDeviceOverrides(
    device: GoveeDevice,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessory: PlatformAccessory,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    identifiedService: IdentifiedService<IdentifierType>,
  ): Promise<IdentifiedService<IdentifierType> | undefined> {
    return identifiedService;
  }

  protected abstract updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
    serviceIdentifier?: IdentifierType,
  );

  protected get(
    accessory: PlatformAccessory,
  ): IdentifiedService<IdentifierType>[] {
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
  ): IdentifiedService<IdentifierType> {
    return {
      service: AccessoryService.setServicePrimary(
        accessory,
        accessory.getService(
          this.serviceType,
        ) || accessory.addService(
          this.serviceType,
        ),
      ),
    };
  }

  private getSubTypeService(
    accessory: PlatformAccessory,
    subType: ServiceSubType<IdentifierType>,
  ): IdentifiedService<IdentifierType> {
    return {
      service: AccessoryService.setServicePrimary(
        accessory,
        accessory.getServiceById(
          this.serviceType,
          subType.subType,
        ) || accessory.addService(
          this.serviceType,
          `${accessory.displayName} ${subType.nameSuffix || subType.subType}`,
          subType.subType,
        ),
        subType.primary,
        subType.linkToPrimary,
      ),
      subType: subType,
      identifier: subType.identifier,
    };
  }
}
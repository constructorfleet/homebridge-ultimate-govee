import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Emitter} from '../../../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';
import {LoggingService} from '../../../logging/LoggingService';
import {PlatformConfigService} from '../../config/PlatformConfigService';
import {GoveeDeviceOverride} from '../../config/GoveePluginConfig';

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
  service?: Service;
  identifier?: IdentifierType;
  subType?: ServiceSubType<IdentifierType>;
}

export abstract class AccessoryService<IdentifierType> extends Emitter {
  protected abstract readonly serviceType: WithUUID<typeof Service>;
  protected subTypes?: ServiceSubType<IdentifierType>[] = undefined;

  protected constructor(
    eventEmitter: EventEmitter2,
    protected readonly configService: PlatformConfigService,
    protected readonly SERVICES: typeof Service,
    protected readonly CHARACTERISTICS: typeof Characteristic,
    protected readonly log: LoggingService,
  ) {
    super(eventEmitter);
  }

  public setup(
    device: GoveeDevice,
    deviceOverride: GoveeDeviceOverride,
  ) {
    return;
  }

  public updateAccessory(
    accessory: PlatformAccessory,
    device: GoveeDevice,
  ): PlatformAccessory {
    if (!this.supports(device)) {
      return accessory;
    }
    const deviceOverride =
      this.configService.getDeviceConfiguration(device.deviceId);
    if (deviceOverride !== undefined) {
      this.setup(
        device,
        deviceOverride,
      );
    }
    this.get(
      accessory,
      deviceOverride,
    ).forEach(
      (identifiedService: IdentifiedService<IdentifierType>) => {
        const serviceOverride = this.processDeviceOverrides(
          accessory,
          identifiedService,
          device,
          deviceOverride,
        );
        if (!serviceOverride || !serviceOverride.service) {
          return;
        }

        this.updateServiceCharacteristics(
          serviceOverride.service,
          device,
          identifiedService.identifier,
        );
      },
    );
    return accessory;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected supports(device: GoveeDevice): boolean {
    return true;
  }

  protected shouldAddService(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deviceOverride?: GoveeDeviceOverride,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subType?: ServiceSubType<IdentifierType>,
  ): boolean {
    return true;
  }

  protected processDeviceOverrides(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessory: PlatformAccessory,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    identifiedService: IdentifiedService<IdentifierType>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    device: GoveeDevice,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deviceOverride?: GoveeDeviceOverride,
  ): IdentifiedService<IdentifierType> | undefined {
    return identifiedService;
  }

  protected abstract updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
    serviceIdentifier?: IdentifierType,
  );

  protected get(
    accessory: PlatformAccessory,
    deviceOverride?: GoveeDeviceOverride,
  ): IdentifiedService<IdentifierType>[] {
    if (!this.subTypes || this.subTypes.length === 0) {
      return this.getService(
        accessory,
        deviceOverride,
      );
    }
    return this.subTypes.map(
      (subType) => this.getSubTypeService(
        accessory,
        subType,
        deviceOverride,
      ),
    );
  }

  private setServicePrimary(
    accessory: PlatformAccessory,
    service?: Service,
    primary?: boolean,
    linkToPrimary?: boolean,
  ): Service | undefined {
    if (!service) {
      return undefined;
    }
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

  private getService(
    accessory: PlatformAccessory,
    deviceOverride?: GoveeDeviceOverride,
  ): IdentifiedService<IdentifierType>[] {
    return [{
      service: this.setServicePrimary(
        accessory,
        accessory.getService(
          this.serviceType,
        ) || this.tryAddService(
          accessory,
          deviceOverride,
        ),
      ),
    }];
  }

  private getSubTypeService(
    accessory: PlatformAccessory,
    subType: ServiceSubType<IdentifierType>,
    deviceOverride?: GoveeDeviceOverride,
  ): IdentifiedService<IdentifierType> {
    return {
      service: this.setServicePrimary(
        accessory,
        accessory.getServiceById(
          this.serviceType,
          subType.subType,
        ) || this.tryAddService(
          accessory,
          deviceOverride,
          subType,
        ),
        subType.primary,
        subType.linkToPrimary,
      ),
      subType: subType,
      identifier: subType.identifier,
    };
  }

  private tryAddService(
    accessory: PlatformAccessory,
    deviceOverride?: GoveeDeviceOverride,
    subType?: ServiceSubType<IdentifierType>,
  ): Service | undefined {
    if (!this.shouldAddService(deviceOverride, subType)) {
      return undefined;
    }
    if (!subType) {
      return accessory.addService(
        this.serviceType,
        `${accessory.displayName}`,
      );
    }

    return accessory.addService(
      this.serviceType,
      `${accessory.displayName} ${subType.nameSuffix || subType.subType}`,
      subType.subType,
    );
  }
}

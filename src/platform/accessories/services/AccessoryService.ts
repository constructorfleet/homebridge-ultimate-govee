import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';

export abstract class AccessoryService {
  protected abstract readonly ServiceType: WithUUID<typeof Service>;

  protected constructor(
    protected readonly SERVICES: typeof Service,
    protected readonly CHARACTERISTICS: typeof Characteristic,
    protected readonly log: Logging,
  ) {

  }

  public initializeAccessory(
    accessory: PlatformAccessory,
    device: GoveeDevice,
  ): PlatformAccessory {
    if (!this.supports(device)) {
      return accessory;
    }
    const service = this.get(accessory);
    this.initializeServiceCharacteristics(
      service,
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

  protected abstract updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  );

  protected abstract initializeServiceCharacteristics(
    service: Service,
  );

  protected get(
    accessory: PlatformAccessory,
  ): Service {
    return accessory.getService(this.ServiceType) || accessory.addService(this.ServiceType);
  }
}
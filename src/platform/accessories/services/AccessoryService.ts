import {Characteristic, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';

export abstract class AccessoryService {
  protected abstract readonly ServiceType: WithUUID<typeof Service>;

  protected constructor(
    protected readonly SERVICES: typeof Service,
    protected readonly CHARACTERISTICS: typeof Characteristic,
  ) {

  }

  public updateAccessory(
    accessory: PlatformAccessory,
    device: GoveeDevice,
  ): PlatformAccessory {
    this.updateServiceCharacteristics(
      this.get(accessory),
      device,
    );
    return accessory;
  }

  protected abstract updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  );

  protected get(
    accessory: PlatformAccessory,
  ): Service {
    return accessory.getService(this.ServiceType) || accessory.addService(this.ServiceType);
  }
}
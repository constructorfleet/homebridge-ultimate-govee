import {Characteristic, CharacteristicValue, PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {Logging} from 'homebridge/lib/logger';
import {Emitter} from '../../../util/types';
import {EventEmitter2} from '@nestjs/event-emitter';

export abstract class AccessoryService extends Emitter {
  protected abstract readonly ServiceType: WithUUID<typeof Service>;

  protected constructor(
    eventEmitter: EventEmitter2,
    protected readonly SERVICES: typeof Service,
    protected readonly CHARACTERISTICS: typeof Characteristic,
    protected readonly log: Logging,
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
    accessory.context.device = device;

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

  protected setCharacteristicValueHandler(
    characteristic: Characteristic,
    handler: (device: GoveeDevice, value: CharacteristicValue) => void,
  ): Characteristic {
    characteristic.onSet(
      (
        value: CharacteristicValue,
        context: { device: GoveeDevice },
      ) => handler(context.device, value),
    );
    return characteristic;
  }

  protected get(
    accessory: PlatformAccessory,
  ): Service {
    return accessory.getService(this.ServiceType) || accessory.addService(this.ServiceType);
  }
}
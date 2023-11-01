import { AccessoryService } from './AccessoryService';
import { Inject } from '@nestjs/common';
import { PLATFORM_CHARACTERISTICS, PLATFORM_SERVICES } from '../../../util/const';
import { Characteristic, PlatformAccessory, Service, UnknownContext, WithUUID } from 'homebridge';
import { GoveeDevice } from '../../../devices/GoveeDevice';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggingService } from '../../../logging/LoggingService';
import { GoveeAirPurifier, GoveeAirPurifierLite } from '../../../devices/implementations/GoveeAirPurifier';
import { PlatformConfigService } from '../../config/PlatformConfigService';
import { ServiceRegistry } from '../ServiceRegistry';
import { FilterMaintenanceState } from '../../../devices/states/FilterMaintenance';

@ServiceRegistry.register(
  GoveeAirPurifier,
  GoveeAirPurifierLite,
)
export class FilterService extends AccessoryService<void, typeof Service.FilterMaintenance> {
  protected readonly serviceType: WithUUID<typeof Service.FilterMaintenance> = this.SERVICES.FilterMaintenance;

  constructor(
    eventEmitter: EventEmitter2,
    platformConfig: PlatformConfigService,
    @Inject(PLATFORM_SERVICES) SERVICES: typeof Service,
    @Inject(PLATFORM_CHARACTERISTICS) CHARACTERISTICS: typeof Characteristic,
    log: LoggingService,
  ) {
    super(
      eventEmitter,
      platformConfig,
      SERVICES,
      CHARACTERISTICS,
      log,
    );
  }

  protected override addServiceTo(
    accessory: PlatformAccessory<UnknownContext>,
  ): Service | undefined {
    return accessory.addService(
      this.serviceType,
      accessory.displayName,
    );
  }

  protected supports(device: GoveeDevice): boolean {
    return 'isFilterExpired' in device;
  }

  protected updateServiceCharacteristics(
    service: Service,
    device: GoveeDevice,
  ) {
    const filterDevice = device as unknown as FilterMaintenanceState;
    service
      .getCharacteristic(this.CHARACTERISTICS.FilterChangeIndication)
      .updateValue(
        filterDevice.isFilterExpired
          ? this.CHARACTERISTICS.FilterChangeIndication.CHANGE_FILTER
          : this.CHARACTERISTICS.FilterChangeIndication.FILTER_OK);
    if (filterDevice.filterLifeRemaining !== undefined) {
      service
        .getCharacteristic(this.CHARACTERISTICS.FilterLifeLevel)
        .updateValue(
          filterDevice.filterLifeRemaining ?? 0.0,
        );
    }
  }
}
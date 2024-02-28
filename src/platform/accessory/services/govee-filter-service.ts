import { ServiceRegistry } from './services.registry';
import {
  Device,
  FilterExpiredStateName,
  FilterLifeStateName,
  Purifier,
  PurifierDevice,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { Subscription } from 'rxjs';
import { Optional } from '@constructorfleet/ultimate-govee/dist/common';

@ServiceRegistry.register(PurifierDevice)
export class GoveeFilterService extends GoveeService(
  Service.FilterMaintenance,
  false,
  FilterLifeStateName,
  FilterExpiredStateName,
) {
  static readonly UUID = Service.FilterMaintenance.UUID;
  readonly UUID = Service.FilterMaintenance.UUID;

  constructor(device: Device & Purifier) {
    super(device);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.subscribeToState(
        FilterExpiredStateName,
        Characteristic.FilterChangeIndication,
        (value) =>
          value
            ? Characteristic.FilterChangeIndication.CHANGE_FILTER
            : Characteristic.FilterChangeIndication.FILTER_OK,
      ),
      this.subscribeToState(
        FilterLifeStateName,
        Characteristic.FilterLifeLevel,
      ),
    ];
  }
}

import { Characteristic, Service } from 'hap-nodejs';
import {
  FilterExpiredStateName,
  FilterLifeStateName,
  Purifier,
  PurifierDevice,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';

@HandlerRegistry.forDevice(PurifierDevice)
export class FilterMaintenanceHandler extends ServiceHandler<Purifier> {
  readonly serviceType = Service.FilterMaintenance;
  readonly handlers = {
    [FilterExpiredStateName]: [
      {
        characteristic: Characteristic.FilterChangeIndication,
        updateValue: (value) =>
          value
            ? Characteristic.FilterChangeIndication.CHANGE_FILTER
            : Characteristic.FilterChangeIndication.FILTER_OK,
      },
    ],
    [FilterLifeStateName]: [
      {
        characteristic: Characteristic.FilterLifeLevel,
        updateValue: (value: number) => value,
      },
    ],
  };
}

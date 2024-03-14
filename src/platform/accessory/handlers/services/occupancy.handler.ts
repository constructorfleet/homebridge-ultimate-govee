import { Characteristic, Service } from 'hap-nodejs';
import {
  PresenceDevice,
  PresenceSensor,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';
import {
  EnablePresenceStateName,
  PresenceData,
  BiologicalPresenceStateName,
  EnablePresenceFlags,
} from '@constructorfleet/ultimate-govee';

@HandlerRegistry.forDevice(PresenceDevice)
export class PresenceOccupancySensorHandler extends ServiceHandler<PresenceSensor> {
  readonly serviceType = Service.OccupancySensor;
  readonly handlers = {
    [BiologicalPresenceStateName]: [
      {
        characteristic: Characteristic.OccupancyDetected,
        updateValue: (value: PresenceData) => value.detected,
      },
    ],
    [EnablePresenceStateName]: [
      {
        characteristic: Characteristic.Active,
        updateValue: (value: EnablePresenceFlags) =>
          value.biologicalEnabled === true,
        onSet: (value) => ({
          biologicalEnabled: value === Characteristic.Active.ACTIVE,
        }),
      },
    ],
  };
}

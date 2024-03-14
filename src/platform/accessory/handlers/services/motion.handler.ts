import { Characteristic, Service } from 'hap-nodejs';
import {
  MMWavePresenceStateName,
  PresenceDevice,
  PresenceSensor,
} from '@constructorfleet/ultimate-govee';
import { ServiceHandler } from '../service.handler';
import { HandlerRegistry } from '../handler.registry';
import {
  EnablePresenceStateName,
  PresenceData,
} from '@constructorfleet/ultimate-govee/dist/domain';
import { EnablePresenceFlags } from '@constructorfleet/ultimate-govee';

@HandlerRegistry.forDevice(PresenceDevice)
export class PresenceMotionSensorHandler extends ServiceHandler<PresenceSensor> {
  readonly serviceType = Service.MotionSensor;
  readonly handlers = {
    [MMWavePresenceStateName]: [
      {
        characteristic: Characteristic.MotionDetected,
        updateValue: (value: PresenceData) => value.detected,
      },
    ],
    [EnablePresenceStateName]: [
      {
        characteristic: Characteristic.Active,
        updateValue: (value: EnablePresenceFlags) =>
          value.mmWaveEnabled === true,
        onSet: (value) => ({
          mmWaveEnabled: value === Characteristic.Active.ACTIVE,
        }),
      },
    ],
  };
}

import {State} from './State';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import { getCommandValues } from '../../util/opCodeUtils';
import { REPORT_IDENTIFIER } from '../../util/const';

const commandIdentifiers = [
  25,
];

export interface FilterMaintenanceState {
  isFilterExpired?: boolean;
  filterLifeRemaining?: number;
}

export function FilterMaintenance<StateType extends State>(
  stateType: new (...args) => StateType,
) {
  // @ts-ignore
  return class extends stateType implements FilterExpirationState {
    public isFilterExpired?: boolean;
    public filterLifeRemaining?: number;

    public constructor(...args) {
      super(...args);
      this.addDeviceStatusCodes(commandIdentifiers);
    }

    public override parse(deviceState: DeviceState): ThisType<this> {
      const commandValues = getCommandValues(
        [REPORT_IDENTIFIER, ...commandIdentifiers],
        deviceState.commands,
      );
      if (commandValues?.length === 1) {
        this.isFilterExpired = commandValues[0][0] !== 0;
        if (commandValues[0][3] !== 0) {
          this.filterLifeRemaining = commandValues[0][5];
        }
      }
      return super.parse(deviceState);
    }
  };
}
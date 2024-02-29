import { ServiceRegistry } from './services.registry';
import {
  ControlLockStateName,
  Device,
  Humidifier,
  HumidifierDevice,
  HumidityStateName,
  MistLevelStateName,
  Optional,
  WaterShortageStateName,
} from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { Subscription } from 'rxjs';
import { TargetHumidityStateName } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/appliances/humidifier/humidifier.target-humidity';

@ServiceRegistry.register(HumidifierDevice)
export class GoveeHumidifierService extends GoveeService(
  Service.HumidifierDehumidifier,
  true,
  ControlLockStateName,
  WaterShortageStateName,
  HumidityStateName,
  TargetHumidityStateName,
) {
  static readonly UUID = Service.HumidifierDehumidifier.UUID;
  readonly UUID = Service.HumidifierDehumidifier.UUID;

  constructor(device: Device & Humidifier) {
    super(device);
  }

  setStates() {
    this.getCharacteristic(Characteristic.WaterLevel).setProps({
      minValue: 0,
      maxValue: 100,
    });
    this.setState(
      Characteristic.LockPhysicalControls,
      ControlLockStateName,
      (value) =>
        value === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
    );
    this.setState(
      Characteristic.TargetRelativeHumidity,
      TargetHumidityStateName,
    );
    this.setState(Characteristic.RotationSpeed, MistLevelStateName);
  }

  updateCharacteristics(): Optional<Subscription>[] {
    return [
      this.setCharacteristicProps(
        [
          Characteristic.CurrentRelativeHumidity,
          Characteristic.TargetRelativeHumidity,
        ],
        HumidityStateName,
        (value: { range: { min?: number; max?: number } }) =>
          value?.range?.min !== undefined && value?.range?.max !== undefined
            ? { minValue: value.range.min, maxValue: value.range.max }
            : {},
      ),
      this.subscribeToState(
        HumidityStateName,
        Characteristic.CurrentRelativeHumidity,
        (value: { current?: number }) => value.current,
      ),
      this.subscribeToState(
        TargetHumidityStateName,
        Characteristic.TargetRelativeHumidity,
      ),
      this.subscribeToState(
        ControlLockStateName,
        Characteristic.LockPhysicalControls,
        (value) =>
          value
            ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
      ),
      this.subscribeToState(
        WaterShortageStateName,
        Characteristic.WaterLevel,
        (value) => (value ? 0 : 100),
      ),
    ];
  }
}

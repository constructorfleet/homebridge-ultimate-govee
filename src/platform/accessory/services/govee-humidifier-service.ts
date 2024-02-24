import { ServiceRegistry } from './services.registry';
import { Device, Humidifier } from '@constructorfleet/ultimate-govee';
import { Service, Characteristic } from 'hap-nodejs';
import { GoveeService } from './govee-service';
import { HumidifierDevice } from '@constructorfleet/ultimate-govee/dist/domain/devices/impl/appliances/humidifier/humidifier';

@ServiceRegistry.register(HumidifierDevice)
export class GoveeHumidifierService extends GoveeService(
  Service.HumidifierDehumidifier,
) {
  constructor(device: Device & Humidifier) {
    super(device);
    const [targetChar, currentChar, waterLevelChar, lockChar, fanSpeedChar] = [
      this.getCharacteristic(
        Characteristic.RelativeHumidityHumidifierThreshold,
      ),
      this.getCharacteristic(Characteristic.CurrentRelativeHumidity),
      this.getCharacteristic(Characteristic.WaterLevel),
      this.getCharacteristic(Characteristic.LockPhysicalControls),
      this.getCharacteristic(Characteristic.RotationSpeed),
      this.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState),
    ];
    const { min, max } = device.humidity?.value.range ?? { min: 0, max: 100 };
    if (min !== undefined && max !== undefined) {
      this.setRange(min, max, targetChar, currentChar);
    }
    this.setValues([0, 100], waterLevelChar);

    targetChar?.onSet((value) =>
      device.targetHumidity?.setState(value as number),
    );
    lockChar?.onSet((value) =>
      device.controlLock?.setState(
        value === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
      ),
    );
    fanSpeedChar?.onSet((value) => device.mistLevel?.setState(value as number));

    if (device.humidity?.value?.current !== undefined) {
      this.updateValue(device.humidity.value.current, currentChar);
    }
    if (device.targetHumidity?.value !== undefined) {
      this.updateValue(device.targetHumidity.value, targetChar);
    }
    if (device.controlLock?.value !== undefined) {
      this.updateValue(
        device.controlLock.value
          ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
          : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
        lockChar,
      );
    }
    if (device.waterShortage?.value !== undefined) {
      this.updateValue(device.waterShortage.value ? 0 : 100, waterLevelChar);
    }

    device.humidity?.subscribe((humidity) => {
      if (
        humidity.range.min !== undefined &&
        humidity.range.max !== undefined
      ) {
        this.setRange(
          humidity.range.min,
          humidity.range.max,
          targetChar,
          currentChar,
        );
      }
      if (humidity.current !== undefined) {
        this.updateValue(humidity.current, currentChar);
      }
    });
    device.targetHumidity?.subscribe((target) => {
      if (target !== undefined) {
        this.updateValue(target, targetChar);
      }
    });
    device.controlLock?.subscribe((lock) => {
      if (lock !== undefined) {
        this.updateValue(
          lock
            ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
          lockChar,
        );
      }
    });
    device.waterShortage?.subscribe((value) => {
      this.updateValue(value ? 0 : 100, waterLevelChar);
    });
    device.mistLevel?.subscribe((value) => {
      if (value !== undefined) {
        this.updateValue(value, fanSpeedChar);
      }
    });
  }
}

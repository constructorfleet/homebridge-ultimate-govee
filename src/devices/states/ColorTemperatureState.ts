import {ModeStateConfig} from './ModeState';
import {KELVIN_MAXIMUM, KELVIN_MINIMUM} from '../../util/colorUtils';

const clampValue =
  (val: number): number =>
    Math.min(
      Math.max(
        val,
        KELVIN_MINIMUM,
      ),
      KELVIN_MAXIMUM,
    );

export const ColorTemperatureStateConstructor = ModeStateConfig<number>(
  0,
  clampValue,
  clampValue,
);

export type ColorTemperatureState = typeof ColorTemperatureStateConstructor;

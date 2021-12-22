import {ModeStateConfig} from './ModeState';
import {
  HUE_MAXIMUM,
  HUE_MINIMUM,
  SATURATION_MAXIMUM,
  SATURATION_MINIMUM,
} from '../../util/colorUtils';

const clampHue =
  (val: number): number => Math.min(Math.max(val, HUE_MINIMUM), HUE_MAXIMUM);

const clampSaturation =
  (val: number): number => Math.min(Math.max(val, SATURATION_MINIMUM),
    SATURATION_MAXIMUM);

export const HueStateConstructor = ModeStateConfig<number>(
  0,
  clampHue,
  clampHue,
);

export const SaturationStateConstructor = ModeStateConfig<number>(
  0,
  clampSaturation,
  clampSaturation,
);

declare type HueState = typeof HueStateConstructor;
declare type SaturationState = typeof SaturationStateConstructor;

export interface HueSaturationState {
  hue: HueState;
  saturation: SaturationState;
}

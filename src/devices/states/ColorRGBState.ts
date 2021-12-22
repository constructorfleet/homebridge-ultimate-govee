import {ModeStateConfig} from './ModeState';

const clampValue =
  (val: number): number => Math.min(Math.max(val, 0), 255);

export const ColorStateConstructor = ModeStateConfig<number>(
  0,
  clampValue,
  clampValue,
);

declare type ColorState = typeof ColorStateConstructor;

export interface ColorRGBState {
  red: ColorState;
  green: ColorState;
  blue: ColorState;
}

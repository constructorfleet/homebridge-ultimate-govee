import {ModeStateConfig} from './ModeState';

const hexToBrightness =
  (val: number): number => Math.min(Math.max(val, 0), 100);
const brightnessToHex =
  (val: number): number => val * 255 / 100;

export const BrightnessStateConstructor = ModeStateConfig<number>(
  0,
  hexToBrightness,
  brightnessToHex,
);

export type BrightnessState = typeof BrightnessStateConstructor;
import {ModeStateConfig} from './ModeState';

export enum Power {
  OFF = 0x00,
  ON = 0x01,
}

const hexToPowerState =
  (val: number): Power => Power[Power[val]];
const powerToHex =
  (val: Power): number => val.valueOf();

export const PowerStateConstructor = ModeStateConfig<Power>(
  Power.OFF,
  hexToPowerState,
  powerToHex,
);

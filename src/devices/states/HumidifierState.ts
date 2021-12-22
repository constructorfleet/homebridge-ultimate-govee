import {ModeStateConfig} from './ModeState';

const relativeHumidityToMist =
  (val: number): number => Math.round(92 / 99 + (7 * val) / 99);
const mistToRelativeHumidity =
  (val: number): number => -92 / 7 + (99 * val) / 7;

export const HumidifierStateConstructor = ModeStateConfig<number>(
  4,
  relativeHumidityToMist,
  mistToRelativeHumidity,
);

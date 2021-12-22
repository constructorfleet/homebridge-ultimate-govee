import {ModeStateConfig} from './ModeState';

export enum PurifierFanMode {
  QUIET = 0x10,
  LOW = 0x01,
  MEDIUM = 0x02,
  HIGH = 0x03,
}

const speedToFan =
  (val: number): PurifierFanMode =>
    val <= 25
      ? PurifierFanMode.QUIET
      : val <= 50
        ? PurifierFanMode.LOW
        : val <= 75
          ? PurifierFanMode.MEDIUM
          : PurifierFanMode.HIGH;
const fanToSpeed =
  (val: PurifierFanMode): number =>
    val === PurifierFanMode.QUIET
      ? 25
      : val === PurifierFanMode.LOW
        ? 50
        : val === PurifierFanMode.MEDIUM
          ? 75
          : 100;

export const PurifierFanStateConstructor = ModeStateConfig<PurifierFanMode>(
  PurifierFanMode.QUIET,
  speedToFan,
  fanToSpeed,
);

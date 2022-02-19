export interface DeviceStateColor {
  red: number;

  green: number;

  blue: number;
}

export interface DeviceState {
  deviceId: string;

  model?: string;

  command?: string;

  on?: boolean;

  connected?: boolean;

  brightness?: number;

  colorTemperature?: number;

  mode?: number;

  color?: DeviceStateColor;

  modeValue?: number[];

  sleepValue?: number[];

  wakeupValue?: number[];

  timerValue?: number[];

  commands?: number[][];
}

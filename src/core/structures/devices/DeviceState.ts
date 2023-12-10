export interface DeviceStateColor {
  red?: number;

  green?: number;

  blue?: number;

  r?: number;

  g?: number;

  b?: number;
}

export interface DeviceStatus {
  codes?: number[];
}

export interface DeviceState {
  deviceId: string;

  model?: string;

  command?: string;

  on?: boolean;

  connected?: boolean;

  brightness?: number;

  colorTemperature?: number;

  filterExpired?: boolean;

  mode?: number;

  color?: DeviceStateColor;

  status?: DeviceStatus;

  modeValue?: number[];

  sleepValue?: number[];

  wakeupValue?: number[];

  timerValue?: number[];

  commands?: number[][];
}

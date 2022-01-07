export interface DeviceStateColor {
  red: number;

  green: number;

  blue: number;
}

export interface DeviceState {
  deviceId: string;

  model: string;

  on?: boolean;

  connected?: boolean;

  brightness?: number;

  colorTemperature?: number;

  mode?: number;

  color?: DeviceStateColor;

  commands?: number[][];
}

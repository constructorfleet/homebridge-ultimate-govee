export enum FanSpeed {
  QUIET = 0x10,
  LOW = 0x01,
  MEDIUM = 0x02,
  HIGH = 0x03,
}

export enum MistOutput {
  MINIMAL = 0x01,
  SUBTLE = 0x02,
  LOW = 0x03,
  MEDIUM = 0x04,
  MEDIUM_HIGH = 0x05,
  HIGH = 0x07,
  INTENSE = 0x07,
  MAXIMUM = 0x08,
}

export interface DeviceState {
  deviceId: string;

  model: string;

  power: PowerState | unknown;

  connection: ConnectionState | undefined;

  brightness: BrightnessState | undefined;

  colorTemperature: ColorTemperatureState | undefined;

  color: ColorRGBState | undefined;

  mode: ModeState | undefined;

  scene: SceneState | undefined;

  timer: TimerState | undefined;

  schedule: ScheduleState | undefined;

  controlsLocked: ControlLockState | undefined;

  fanSpeed: FanSpeedState | undefined;

  mistOutput: MistOutputState | undefined;
}

export interface PowerState {
  isActive: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
}

export interface BrightnessState {
  brightness: number;
}

export interface ColorTemperatureState {
  temperature: number;
}

export interface ColorRGBState {
  red: number;
  green: number;
  blue: number;
}

export interface ModeState {
  mode: number;
}

export interface SceneState {
  scene: number;
}

export interface TimerState {
  enabled: boolean;
  durationMinutes: number;
}

export interface ScheduleState {
  enabled: boolean;
}

export interface ControlLockState {
  controlsLocked: boolean;
}

export interface FanSpeedState {
  fanSpeed: FanSpeed;
}

export interface MistOutputState {
  mistOutput: MistOutput;
}
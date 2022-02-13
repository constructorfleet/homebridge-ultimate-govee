import {DeviceTransition} from '../devices/DeviceTransition';
import {State} from '../../../devices/states/State';
import {GoveeDevice} from '../../../devices/GoveeDevice';
import {DeviceBrightnessTransition} from '../devices/transitions/DeviceBrightnessTransition';
import {DeviceColorTransition} from '../devices/transitions/DeviceColorTransition';
import {DeviceOnOffTransition} from '../devices/transitions/DeviceOnOffTransition';
import {DeviceColorTemperatureTransition} from '../devices/transitions/DeviceColorTemperatureTransition';
import {Constructor} from '@nestjs/common/utils/merge-with-values.util';

export interface IoTCommandDataColor {
  red?: number;
  green?: number;
  blue?: number;
}

export interface IoTCommandData {
  command?: string[];
  color?: IoTCommandDataColor;
  red?: number;
  green?: number;
  blue?: number;
  val?: number;
  colorTemInKelvin?: number;
}

export type IoTCommand = 'pt' | 'ptReal' | 'turn' | 'brightness' | 'color' | 'colorTem';

export interface IoTCommandMessage {
  device: string;
  cmd: IoTCommand;
  cmdVersion: number;
  transaction: string;
  type: number;
  data: IoTCommandData;
}

export function getIoTCommandMessage<T extends DeviceTransition<State & GoveeDevice>>(
  transition: T,
): IoTCommandMessage {
  const ctor = DEVICE_TRANSITION_MAP.get(transition) || IoTOpCodeCommandMessage;
  return new ctor(transition);
}

export abstract class BaseIoTCommandMessage implements IoTCommandMessage {
  public readonly device: string;
  public readonly cmd: IoTCommand;
  public readonly cmdVersion = 0;
  public readonly transaction = `u_${Date.now()}`;
  public readonly type = 1;
  public readonly data: IoTCommandData;

  protected constructor(
    transition: DeviceTransition<State & GoveeDevice>,
    command: IoTCommand,
    commandData: IoTCommandData,
  ) {
    this.device = transition.deviceId;
    this.cmd = command;
    this.data = commandData;
  }
}

export class IoTOnOffCommandMessage extends BaseIoTCommandMessage {
  constructor(
    transition: DeviceOnOffTransition,
  ) {
    super(
      transition,
      'turn',
      {
        val: transition.on ? 1 : 0,
      },
    );
  }
}

export class IoTBrightnessCommandMessage extends BaseIoTCommandMessage {
  constructor(
    transition: DeviceBrightnessTransition,
  ) {
    super(
      transition,
      'brightness',
      {
        val: transition.brightness,
      },
    );
  }
}

export class IoTColorCommandMessage extends BaseIoTCommandMessage {
  constructor(
    transition: DeviceColorTransition,
  ) {
    super(
      transition,
      'color',
      {
        red: transition.color.red,
        green: transition.color.green,
        blue: transition.color.blue,
      },
    );
  }
}

export class IoTColorTemperatureCommandMessage extends BaseIoTCommandMessage {
  constructor(
    transition: DeviceColorTemperatureTransition,
  ) {
    super(
      transition,
      'colorTem',
      {
        colorTemInKelvin: transition.temperature,
        color: {
          red: transition.color.red,
          green: transition.color.green,
          blue: transition.color.blue,
        },
      },
    );
  }
}

export class IoTOpCodeCommandMessage extends BaseIoTCommandMessage {
  constructor(
    transition: DeviceTransition<State & GoveeDevice>,
  ) {
    super(
      transition,
      'ptReal',
      {
        command: transition.opCodeCommandString,
      },
    );
  }
}

const DEVICE_TRANSITION_MAP = new Map<DeviceTransition<State & GoveeDevice>, Constructor<IoTCommandMessage>>(
  [
    [DeviceBrightnessTransition.prototype, IoTBrightnessCommandMessage],
    [DeviceColorTransition.prototype, IoTColorCommandMessage],
    [DeviceOnOffTransition.prototype, IoTOnOffCommandMessage],
    [DeviceColorTemperatureTransition.prototype, IoTColorTemperatureCommandMessage],
  ],
);
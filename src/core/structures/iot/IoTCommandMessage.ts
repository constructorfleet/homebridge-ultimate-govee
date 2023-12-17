import { DeviceTransition } from '../devices/DeviceTransition';
import { State } from '../../../devices/states/State';
import { GoveeDevice } from '../../../devices/GoveeDevice';
import { DeviceBrightnessTransition } from '../devices/transitions/DeviceBrightnessTransition';
import { DeviceColorTransition } from '../devices/transitions/DeviceColorTransition';
import { DeviceOnOffTransition } from '../devices/transitions/DeviceOnOffTransition';
import { DeviceColorTemperatureTransition } from '../devices/transitions/DeviceColorTemperatureTransition';
import { DeviceColorTemperatureWCTransition } from '../devices/transitions/DeviceColorTemperatureWCTransition';
import { DeviceColorWCTransition } from '../devices/transitions/DeviceColorWCTransition';

export interface IoTCommandDataColor {
  r?: number;
  g?: number;
  b?: number;
  red?: number;
  green?: number;
  blue?: number;
}

export interface IoTCommandData {
  command?: string[];
  color?: IoTCommandDataColor;
  r?: number;
  g?: number;
  b?: number;
  val?: number;
  colorTemInKelvin?: number;
  opcode?: string;
  value?: string[];
}

export type IoTCommand = 'pt' | 'ptReal' | 'turn' | 'brightness' | 'color' | 'colorTem' | 'colorwc';

export interface IoTCommandMessage {
  device: string;
  cmd: IoTCommand;
  cmdVersion: number;
  transaction: string;
  type: number;
  data: IoTCommandData;
  accountTopic?: string;

  isValid(): boolean;
}

export function getIoTCommandMessage<T extends DeviceTransition<State & GoveeDevice>>(
  transition: T,
): IoTCommandMessage {
  const ctor = getIoTCommandFromTransition(transition);
  return new ctor(transition);
}

export abstract class BaseIoTCommandMessage implements IoTCommandMessage {
  public readonly device: string;
  public readonly cmd: IoTCommand;
  public readonly cmdVersion = 0;
  public readonly transaction = `v_${ Date.now() }000`;
  public readonly type = 1;
  public readonly data: IoTCommandData;

  protected constructor(
    transition: DeviceTransition<State & GoveeDevice>,
    command: IoTCommand,
    commandData: IoTCommandData,
  ) {
    this.device = transition.deviceId;
    this.cmd = command;
    this.data = {
      command: [
        'qgUVAAAAAAAAAAAAAAAAAAAAALo=',
        'qqUBZP///2T///9k////AAAAAJU=',
        'qqUCAP///2T///9k////AAAAAPI=',
        'qqUDZP///2T///9k////AAAAAJc=',
        'qqUEZP///2T///9k////AAAAAJA=',
        'qqUFZP///2T///9k////AAAAAJE=',
        'qhEAHg8PAAAAAAAAAAAAAAAAAKU=',
        'qhL/ZAAAgAoAAAAAAAAAAAAAAKk=',
        'qiP/AAAAgAAAAIAAAACAAAAAgHY='
      ]
    };
  }

  public abstract isValid(): boolean;
}

export class IoTOnOffCommandMessage extends BaseIoTCommandMessage {
  public static readonly TRANSITION_TYPE = DeviceOnOffTransition;

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

  isValid(): boolean {
    return [ 0, 1 ].includes(this.data.val ?? -1);
  }
}

export class IoTBrightnessCommandMessage extends BaseIoTCommandMessage {
  public static readonly TRANSITION_TYPE = DeviceBrightnessTransition;

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

  isValid(): boolean {
    return (this.data.val ?? -1) >= 0;
  }
}

export class IoTColorCommandMessage extends BaseIoTCommandMessage {
  public static readonly TRANSITION_TYPE = DeviceColorTransition;

  // TODO: Determine pt vs color commands
  constructor(
    transition: DeviceColorTransition,
  ) {
    super(
      transition,
      'color',
      {
        r: transition.color.red,
        g: transition.color.green,
        b: transition.color.blue,
      },
    );
  }

  isValid(): boolean {
    return this.data.opcode === 'mode' && (this.data.value?.length ?? -1) > 0;
  }
}

export class IoTColorWCCommandMessage extends BaseIoTCommandMessage {
  public static readonly TRANSITION_TYPE = DeviceColorWCTransition;

  constructor(
    transition: DeviceColorTransition,
  ) {
    super(
      transition,
      'colorwc',
      {
        colorTemInKelvin: 0,
        color: {
          r: transition.color.red,
          g: transition.color.green,
          b: transition.color.blue,
        },
      },
    );
  }

  isValid(): boolean {
    return true;
  }
}

export class IoTColorTemperatureWCCommandMessage extends BaseIoTCommandMessage {
  public static readonly TRANSITION_TYPE = DeviceColorTemperatureWCTransition;

  constructor(
    transition: DeviceColorTemperatureTransition,
  ) {
    super(
      transition,
      'colorwc',
      {
        colorTemInKelvin: transition.temperature,
        color: {
          r: transition.color.red,
          g: transition.color.green,
          b: transition.color.blue,
        },
      },
    );
  }

  isValid(): boolean {
    return ![ this.data.color?.r, this.data.color?.g, this.data.color?.b ]
      .some((color) => color === undefined || color < 0 || color > 255);
  }
}

export class IoTColorTemperatureCommandMessage extends BaseIoTCommandMessage {
  public static readonly TRANSITION_TYPE = DeviceColorTemperatureTransition;

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

  isValid(): boolean {
    return ![ this.data.color?.red, this.data.color?.green, this.data.color?.blue ]
      .some((color) => color === undefined || color < 0 || color > 255);
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

  isValid(): boolean {
    return (this.data.command?.length || -1) > 0;
  }
}

const IoTCommandTypes = [
  IoTBrightnessCommandMessage,
  IoTColorTemperatureWCCommandMessage,
  IoTColorWCCommandMessage,
  IoTColorCommandMessage,
  IoTOnOffCommandMessage,
  IoTColorTemperatureCommandMessage,
];

const getIoTCommandFromTransition =
  (transition: DeviceTransition<GoveeDevice>): new (...args) => BaseIoTCommandMessage =>
    IoTCommandTypes.find(
      (commandMessageType) => transition instanceof commandMessageType.TRANSITION_TYPE,
    ) ?? IoTOpCodeCommandMessage;
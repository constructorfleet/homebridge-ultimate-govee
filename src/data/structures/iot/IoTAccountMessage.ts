import {Expose, Transform, Type} from 'class-transformer';

export class RGBColor {
  @Expose({name: 'r'})
  red!: number;

  @Expose({name: 'g'})
  green!: number;

  @Expose({name: 'b'})
  blue!: number;
}

export class IoTStateResponse {
  @Expose({name: 'onOff'})
  @Transform(
    (params) => params.value as boolean,
    {
      toClassOnly: true,
    },
  )
  @Transform(
    (params) => params.value ? 1 : 0,
    {
      toPlainOnly: true,
    },
  )
  public onOff?: number;

  @Expose({name: 'connected'})
  public connected?: boolean;

  @Expose({name: 'brightness'})
  public brightness?: number;

  @Expose({name: 'colorTemInKelvin'})
  public colorTemperature?: number;

  @Expose({name: 'color'})
  @Type(() => RGBColor)
  public color?: RGBColor;

  @Expose({name: 'mode'})
  public mode?: number;

  @Expose({name: 'result'})
  public result!: number;
}

export class IoTOperatingStateResponse {
  @Expose({name: 'command'})
  public commands!: string[];
  @Expose({name: 'opcode'})
  public opCode!: string;
  @Expose({name: 'modeValue'})
  public modeValue!: string[];
  @Expose({name: 'sleepValue'})
  public sleepValue!: string[];
  @Expose({name: 'wakeupValue'})
  public wakeupValue!: string[];
  @Expose({name: 'timerValue'})
  public timerValue!: string[];
}

interface IoTMessage {
  command: string;

  messageType: number;

  transaction: string;
}

export class IoTAccountMessage
  implements IoTMessage {
  @Expose({name: 'proType'})
  public proType!: number;

  @Expose({name: 'sku'})
  public model!: string;

  @Expose({name: 'device'})
  public deviceId!: string;

  @Expose({name: 'cmd'})
  public command!: string;

  @Expose({name: 'type'})
  public messageType!: number;

  @Expose({name: 'transaction'})
  public transaction!: string;

  @Expose({name: 'pactType'})
  public pactType!: number;

  @Expose({name: 'pactCode'})
  public pactCode!: number;

  @Expose({name: 'softVersion'})
  public softwareVersion?: string;

  @Expose({name: 'wifiSoftVersion'})
  public wifiSoftwareVersion?: string;

  @Expose({name: 'state'})
  @Type(() => IoTStateResponse)
  public state!: IoTStateResponse;

  @Expose({name: 'op'})
  @Type(() => IoTOperatingStateResponse)
  public operatingState?: IoTOperatingStateResponse;
}
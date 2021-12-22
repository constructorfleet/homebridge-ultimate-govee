import {Expose, Transform, Type} from 'class-transformer';
import {decode, encode} from 'base64-arraybuffer';
import {base64ToHex} from '../../../util/encodingUtils';

export const decodeCommand = (
  ...commands: string[]
): ArrayBuffer[] => commands.map(decode);

class State {
  @Expose({name: 'onOff'})
  public onOff?: number;

  @Expose({name: 'result'})
  public result!: number;
}

class OperatingState {
  @Expose({name: 'command'})
  @Transform(
    (params) =>
      params.value
        .map(base64ToHex),
    {
      toClassOnly: true,
    },
  )
  public commands!: string[];
}

interface IoTMessage {
  command: string;

  messageType: number;

  transaction: string;
}

export const encodeCommand = (
  ...commands: ArrayBuffer[]
): string[] => commands.map(encode);

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
  @Type(() => State)
  public state!: State;

  @Expose({name: 'op'})
  @Type(() => OperatingState)
  public operatingState?: OperatingState;
}
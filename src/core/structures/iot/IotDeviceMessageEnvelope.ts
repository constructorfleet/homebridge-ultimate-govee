import {Exclude, Expose, Type} from 'class-transformer';

interface IoTMessage {
  command: string;

  messageType: number;

  transaction: string;
}

class CommandData {
  @Expose({name: 'command'})
  public commands?: string[];
}

export class IoTDeviceMessage
  implements IoTMessage {
  constructor() {
  }

  @Expose({name: 'cmd'})
  public command!: string;

  @Expose({name: 'cmdVersion'})
  public commandVersion!: number;

  @Expose({name: 'type'})
  public messageType!: number;

  @Expose({name: 'accountTopic'})
  public accountTopic?: string;

  @Expose({name: 'transaction'})
  public transaction!: string;

  @Expose({name: 'data'})
  @Type(() => CommandData)
  public commandData?: CommandData;
}

export class IotDeviceMessageEnvelope {
  @Exclude()
  public topic!: string;

  @Expose({name: 'msg'})
  @Type(() => IoTDeviceMessage)
  public messagePayload!: IoTDeviceMessage;
}

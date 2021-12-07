import {Exclude, Expose, Type} from 'class-transformer';

export class IotMessage {
  @Exclude()
  public topic!: string;

  @Expose({name: 'msg'})
  @Type(() => MessagePayload)
  public messagePayload!: MessagePayload;
}

class MessagePayload {
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

class CommandData {
  @Expose({name: 'command'})
  public commands?: string[];
}
import {IoTAccountMessage} from '../../data/structures/iot/IoTAccountMessage';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {Injectable} from '@nestjs/common';
import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {IoTEventData} from '../../core/events/dataClients/iot/IoTEvent';
import {plainToInstance} from 'class-transformer';
import {DeviceStateReceived} from '../../core/events/devices/DeviceReceived';
import {base64ToHex} from '../../util/encodingUtils';

@Injectable()
export class IoTMessageProcessor extends Emitter {
  constructor(
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
  }

  @OnEvent('IOT.Received')
  onIoTMessage(message: IoTEventData) {
    try {
      const acctMessage = plainToInstance(
        IoTAccountMessage,
        message.payload,
      );
      this.emit(
        new DeviceStateReceived(ioTMessageProcessor(acctMessage)),
      );
    } catch (err) {
      console.log(err);
    }
  }
}

export function ioTMessageProcessor(
  message: IoTAccountMessage,
): DeviceState {
  return {
    deviceId: message.deviceId,
    model: message.model,
    on: message?.state?.onOff === undefined
      ? undefined
      : message?.state?.onOff === 1,
    connected: message?.state?.connected,
    brightness: message?.state?.brightness,
    colorTemperature: message?.state?.colorTemperature,
    mode: message?.state?.mode,
    color: message?.state?.color === undefined
      ? undefined
      : {
        red: message.state.color.red,
        green: message.state.color.green,
        blue: message.state.color.blue,
      },
    commands: message.operatingState?.commands?.map(base64ToHex),
  };
}
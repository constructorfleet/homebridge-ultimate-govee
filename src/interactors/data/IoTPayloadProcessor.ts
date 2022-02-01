import {IoTAccountMessage} from '../../core/structures/iot/IoTAccountMessage';
import {DeviceState} from '../../core/structures/devices/DeviceState';
import {Injectable} from '@nestjs/common';
import {Emitter} from '../../util/types';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {IoTEventData} from '../../core/events/dataClients/iot/IoTEvent';
import {plainToInstance} from 'class-transformer';
import {DeviceStateReceived} from '../../core/events/devices/DeviceReceived';
import {base64ToHex} from '../../util/encodingUtils';
import {IoTPublishTo} from '../../core/events/dataClients/iot/IoTPublish';
import {GoveeDevice} from '../../devices/GoveeDevice';
import {LoggingService} from '../../logging/LoggingService';

@Injectable()
export class IoTPayloadProcessor extends Emitter {
  constructor(
    private readonly log: LoggingService,
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'IOT.Received',
    {
      async: true,
    },
  )
  onIoTMessage(message: IoTEventData) {
    this.log.info('RECEIVED', message.payload);
    try {
      this.log.info('RECEIVED', message.payload);
      const acctMessage = plainToInstance(
        IoTAccountMessage,
        message.payload,
      );
      const devState = toDeviceState(acctMessage);
      this.emit(
        new DeviceStateReceived(devState),
      );
    } catch (err) {
      this.log.error(err);
    }
  }

  @OnEvent(
    'DEVICE.REQUEST.State',
    {
      async: true,
    },
  )
  onRequestDeviceState(
    device: GoveeDevice,
  ) {
    if (!device.iotTopic) {
      return;
    }
    this.emit(
      new IoTPublishTo(
        device.iotTopic,
        JSON.stringify({
          topic: device.iotTopic,
          msg: {
            cmd: 'status',
            cmdVersion: 2,
            transaction: `u_${Date.now()}`,
            type: 0,
          },
        }),
      ),
    );
  }
}

export function toDeviceState(
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
import {Injectable} from '@nestjs/common';
import {base64ToHex, Emitter} from '../../util';
import {
  ConnectionState,
  DeviceState,
  DeviceStateReceived,
  IoTAccountMessage,
  IoTEventData,
  IoTPublishToEvent,
  IoTSubscribeToEvent,
} from '../../core';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {GoveeDevice} from '../../devices';
import {plainToInstance} from 'class-transformer';
import {PersistService} from '../../persist';
import {LoggingService} from '../../logging';

@Injectable()
export class IoTEventProcessor extends Emitter {
  private iotConnected = false;

  constructor(
    private readonly log: LoggingService,
    private persist: PersistService,
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
  }

  @OnEvent(
    'IOT.CONNECTION',
  )
  async onIoTConnection(connection: ConnectionState) {
    this.iotConnected = connection === ConnectionState.Connected;
    const accountTopic = this.persist.oauthData?.accountIoTTopic;
    if (connection !== ConnectionState.Connected || !accountTopic) {
      return;
    }
    await this.emitAsync(
      new IoTSubscribeToEvent(accountTopic),
    );
  }

  @OnEvent(
    'IOT.Received',
  )
  async onIoTMessage(message: IoTEventData) {
    try {
      const acctMessage = plainToInstance(
        IoTAccountMessage,
        JSON.parse(message.payload),
      );

      const devState = toIoTDeviceState(acctMessage);
      await this.emitAsync(
        new DeviceStateReceived(devState),
      );
    } catch (err) {
      this.log.error(err);
    }
  }

  @OnEvent(
    'DEVICE.REQUEST.State',
    {
      nextTick: true,
    },
  )
  async onRequestDeviceState(
    device: GoveeDevice,
  ) {
    if (!device.iotTopic) {
      this.log.info(
        'IoTEventProcessor',
        'RequestDeviceState',
        'No topic',
        device.deviceId,
      );
      return;
    }
    await this.emitAsync(
      new IoTPublishToEvent(
        device.iotTopic,
        JSON.stringify({
          topic: device.iotTopic,
          msg: {
            accountTopic: this.persist.oauthData?.accountIoTTopic,
            cmd: 'status',
            cmdVersion: 0,
            transaction: `u_${Date.now()}`,
            type: 0,
          },
        }),
      ),
    );
  }
}

export function toIoTDeviceState(
  message: IoTAccountMessage,
): DeviceState {
  return {
    deviceId: message.deviceId,
    model: message.model,
    command: message.command,
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

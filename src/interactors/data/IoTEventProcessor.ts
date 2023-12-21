import { IoTAccountMessage } from '../../core/structures/iot/IoTAccountMessage';
import { DeviceState } from '../../core/structures/devices/DeviceState';
import { Injectable } from '@nestjs/common';
import { Emitter } from '../../util/types';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { IoTEventData } from '../../core/events/dataClients/iot/IoTEvent';
import { plainToInstance } from 'class-transformer';
import { DeviceStateReceived } from '../../core/events/devices/DeviceReceived';
import { base64ToHex, unpaddedHexToArray } from '../../util/encodingUtils';
import { IoTPublishToEvent } from '../../core/events/dataClients/iot/IoTPublish';
import { GoveeDevice } from '../../devices/GoveeDevice';
import { LoggingService } from '../../logging/LoggingService';
import { ConnectionState } from '../../core/events/dataClients/DataClientEvent';
import { PersistService } from '../../persist/PersistService';
import { IoTSubscribeToEvent } from '../../core/events/dataClients/iot/IotSubscription';
import { DeviceManager } from '../../devices/DeviceManager';
import Winston from 'winston';
import DailyRotateFile from "winston-daily-rotate-file";


const logFiles = {};
const getLogger = (deviceId: string): Winston.Logger => {
  if (!logFiles[ deviceId ]) {
    logFiles[ deviceId ] = Winston.createLogger({
      level: 'info', // Set the log level
      format: Winston.format.combine(
        Winston.format.timestamp(),
        Winston.format.json({
          space: 2
        })
      ),
      transports: [
        // Console transport for logging to the console
        new Winston.transports.Console(),

        // Daily Rotate File transport for rotating log files
        new DailyRotateFile({
          dirname: '/opt/homebridge/logs/devices', // Directory to store log files
          filename: `${ deviceId.replace(/:/g, "") }-%DATE%.log`, // Log file name with date pattern
          datePattern: 'YYYY-MM-DD', // Date pattern for rotation
          zippedArchive: true, // Compress old log files
          maxSize: '20m', // Maximum size for a single log file
          maxFiles: '7d', // Maximum number of log files to keep
        }),
      ],
    });
  }

  return logFiles[ deviceId ];
};

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
    'IOT.CONNECTION', {
    async: true,
    nextTick: true,
  },
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
    'IOT.Device.ReceivedReceived', {
    async: true,
    nextTick: true,
  },
  )
  async onIoTDeviceMessage(message: IoTEventData) {
    console.dir(message, { colors: true, depth: 5 });
  }

  @OnEvent(
    'IOT.Received', {
    async: true,
    nextTick: true,
  },
  )
  async onIoTMessage(message: IoTEventData) {
    try {
      const acctMessage = plainToInstance(
        IoTAccountMessage,
        JSON.parse(message.payload),
      );
      const payload = JSON.parse(message.payload);
      // if (payload.device === "5F:D3:7C:A6:B0:4A:17:8C") {
      getLogger(payload.device || "unknown").info({
        ...payload,
        commandDecoded: (payload.op?.command ?? []).map(base64ToHex).join(""),
        // opCodeDecoded: payload.op?.opcode ?  ([ payload.op?.opcode ] ?? []).map(base64ToHex),
        statusCode: unpaddedHexToArray(payload.state?.sta?.stc)?.join(" ")
      });
      // }

      const devState = toDeviceState(acctMessage);
      await this.emitAsync(
        new DeviceStateReceived(devState),
      );
    } catch (err) {
      this.log.error(err);
    }
  }

  @OnEvent(
    'DEVICE.REQUEST.State', {
    async: true,
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
            transaction: `u_${ Date.now() }`,
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
    command: message.command,
    on: message?.state?.onOff === undefined
      ? undefined
      : message?.state?.onOff === 1,
    connected: message?.state?.connected,
    brightness: message?.state?.brightness,
    colorTemperature: message?.state?.colorTemperature,
    status: {
      codes: unpaddedHexToArray(message?.state?.status?.statusCode),
    },
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
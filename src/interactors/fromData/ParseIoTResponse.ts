import {IoTAccountMessage} from '../../data/structures/iot/IoTAccountMessage';
import {DeviceState} from '../../devices/configs/DeviceState';

export function parseIoTResponse(
  message: IoTAccountMessage,
): DeviceState {
  return {
    deviceId: message.deviceId,
    model: message.model,
    power: message.state.onOff === undefined
      ? undefined
      : {
        isActive: message.state.onOff,
      },
    connection: message.state.connected === undefined
      ? undefined
      : {
        isConnected: message.state.connected,
      },
    brightness: message.state.brightness === undefined
      ? undefined
      : {
        brightness: message.state.brightness,
      },
    colorTemperature: message.state.colorTemperature === undefined
      ? undefined
      : {
        temperature: message.state.colorTemperature,
      },
    color: message.state.color === undefined
      ? undefined
      : {
        red: message.state.color.red,
        green: message.state.color.green,
        blue: message.state.color.blue,
      },
    mode: message.state.mode === undefined
      ? undefined
      : {
        mode: message.state.mode,
      },
    scene: undefined,
    timer: undefined,
    schedule: undefined,
    controlsLocked: undefined,
    fanSpeed: undefined,
    mistOutput: undefined,
  };
}
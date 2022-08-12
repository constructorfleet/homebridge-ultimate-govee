import {ConnectionConfig} from './ConnectionConfig';

export interface IoTConfig
  extends ConnectionConfig {
  deviceTopic?: string;
}

export const supportsIoT = (arg): IoTConfig | undefined => {
  return Reflect.has(arg, 'deviceTopic') && arg.deviceTopic
    ? arg as IoTConfig
    : undefined;
};

export interface IoTConfig
  extends ConnectionConfig {
  deviceTopic?: string;
}

export const supportsIoT = (arg): IoTConfig | undefined => {
  console.log(`supportsIoT ${Reflect.has(arg, 'deviceTopic') && arg.deviceTopic}`)
  return Reflect.has(arg, 'deviceTopic') && arg.deviceTopic
    ? arg as IoTConfig
    : undefined;
};
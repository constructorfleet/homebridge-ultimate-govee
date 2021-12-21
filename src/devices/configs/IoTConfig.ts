export interface IoTConfig
  extends ConnectionConfig {
  deviceTopic: string;

  accountTopic: string;
}
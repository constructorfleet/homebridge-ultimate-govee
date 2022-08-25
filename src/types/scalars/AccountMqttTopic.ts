import {RegExString} from './RegExString';

export const AccountMqttTopic = RegExString(
    'AccountMqttTopic',
    'MQTT topic for all device and account commands and updates',
    /^GA\/[a-f\d]{32}$/,
);
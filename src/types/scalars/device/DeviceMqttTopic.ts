import {RegExString} from '../RegExString';

export const DeviceMqttTopic = RegExString(
    'DeviceMqttTopic',
    'MQTT topic for device commands and updates',
    /^GD\/[a-f\d]{32}$/,
);
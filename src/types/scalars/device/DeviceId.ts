import {RegExString} from '../RegExString';

export const DeviceId = RegExString(
  'DeviceId',
  'Unique device identifier',
  /^[A-F\d]{2}(:?[A-F\d]{2}){7}/i,
);
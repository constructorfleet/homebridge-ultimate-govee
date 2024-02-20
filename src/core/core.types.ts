import { BinaryLike } from 'crypto';
import { API, PlatformConfig } from 'homebridge';

export type CoreModuleOptions = {
  api: API;
  config: PlatformConfig;
  generateUUID: (data: BinaryLike) => string;
};

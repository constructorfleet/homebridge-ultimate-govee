import { Device } from '@constructorfleet/ultimate-govee';
import { LogLevel } from '@nestjs/common';
import { BinaryLike } from 'crypto';
import { API, PlatformAccessory, PlatformConfig } from 'homebridge';
import { Logger } from '../../logger/logger.types';

export type AccessoryModuleOptions = {
  api: API;
  config: PlatformConfig;
  configPath: string;
  storagePath: string;
  generateUUID: (data: BinaryLike) => string;
  accessories?: PlatformAccessory<Device>[];
  logger: Logger;
  disabledLevels?: LogLevel[];
};

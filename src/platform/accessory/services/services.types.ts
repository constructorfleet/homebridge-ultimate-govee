import { Device } from '@constructorfleet/ultimate-govee';
import { Service } from 'homebridge';

export type ServiceFactory = (device: Device) => Service[] | undefined;

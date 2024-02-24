import { FactoryProvider, Inject } from '@nestjs/common';
import {
  AccessoryMapKey,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from './accessory.const';
import { DeltaMap } from '@constructorfleet/ultimate-govee/dist/common';
import { PlatformAccessory } from 'homebridge';
import { BehaviorSubject } from 'rxjs';
import { Device } from '@constructorfleet/ultimate-govee';

export const InjectAccessoryMap = Inject(AccessoryMapKey);
export const AccessoryMapProvider: FactoryProvider = {
  provide: AccessoryMapKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: typeof OPTIONS_TYPE) =>
    new DeltaMap<string, BehaviorSubject<PlatformAccessory<Device>>>(
      options.accessories?.map((a) => [a.UUID, new BehaviorSubject(a)]) ?? [],
    ),
};

import { FactoryProvider, Inject } from '@nestjs/common';
import {
  AccessoryMapKey,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from './accessory.const';
import { DeltaMap } from '@constructorfleet/ultimate-govee/dist/common';
import { GoveeAccessory } from './accessory.types';
import { BehaviorSubject, Observable } from 'rxjs';

export const InjectAccessoryMap = Inject(AccessoryMapKey);
export const AccessoryMapProvider: FactoryProvider = {
  provide: AccessoryMapKey,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: typeof OPTIONS_TYPE) =>
    new DeltaMap<string, Observable<GoveeAccessory>>(
      options.accessories
        ?.map((a) => [a.id, a])
        .map(([id, a]) => [
          id as string,
          new BehaviorSubject<GoveeAccessory>(a as GoveeAccessory),
        ]) ?? [],
    ),
};

import { Observable } from 'rxjs';
import { GoveePluginConfig } from './config/v2/plugin-config.govee';
import { GoveeAccessory } from './accessory/accessory.types';
import { DeltaMap, DeltaSet, Device } from '@constructorfleet/ultimate-govee';

export type PlatformStateType = {
  configuration: Observable<GoveePluginConfig>;
  accessories: DeltaMap<string, GoveeAccessory>;
  devices: DeltaSet<Device>;
};

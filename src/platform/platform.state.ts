import { Injectable } from '@nestjs/common';
import { InjectAccessoryMap } from './accessory/accessory.providers';
import { BehaviorSubject } from 'rxjs';
import { InjectConfig } from '../config/plugin-config.providers';
import { GoveePluginConfig } from '../config/v1/plugin-config.govee';
import { PartialBehaviorSubject } from '../common';
import { PlatformAccessory } from 'homebridge';
import { DeltaMap, Device } from '@constructorfleet/ultimate-govee';

@Injectable()
export class PlatformState {
  constructor(
    @InjectConfig
    readonly config: PartialBehaviorSubject<GoveePluginConfig>,
    @InjectAccessoryMap
    readonly accessories: DeltaMap<
      string,
      BehaviorSubject<PlatformAccessory<Device>>
    >,
  ) {}
}

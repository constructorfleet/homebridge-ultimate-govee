import { Injectable } from '@nestjs/common';
import { InjectAccessoryMap } from './accessory/accessory.providers';
import { Observable } from 'rxjs';
import { InjectConfig } from '../config/plugin-config.providers';
import { GoveePluginConfig } from '../config/v1/plugin-config.govee';
import { PartialBehaviorSubject } from '../common';
import { PlatformAccessory } from 'homebridge';

@Injectable()
export class PlatformState {
  constructor(
    @InjectConfig
    config: GoveePluginConfig,
    @InjectAccessoryMap
    private readonly accessories: Observable<
      Map<string, Observable<PlatformAccessory>>
    >,
  ) {
    this.config = new PartialBehaviorSubject(config);
  }

  readonly config: PartialBehaviorSubject<GoveePluginConfig>;
}

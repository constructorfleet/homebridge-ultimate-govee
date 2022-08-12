import {LightEffect} from '../LightEffect';

export class DeviceLightEffect
    extends LightEffect {

  constructor(
      id: number,
      name: string,
      public readonly description: string,
      public readonly deviceId: string,
      public enabled: boolean = false,
  ) {
    super(id, name);
  }
}

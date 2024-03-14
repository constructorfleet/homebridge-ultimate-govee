import { Expose } from 'class-transformer';

export class ControlChannels {
  constructor() {}
  @Expose({ name: 'iot' })
  iot: boolean = false;

  @Expose({ name: 'ble' })
  ble: boolean = false;
}

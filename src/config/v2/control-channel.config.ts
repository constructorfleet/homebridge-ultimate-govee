import { Expose } from 'class-transformer';

export class ControlChannels {
  @Expose({ name: 'iot' })
  iot: boolean = false;

  @Expose({ name: 'ble' })
  ble: boolean = false;
}

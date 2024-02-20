import { Expose } from 'class-transformer';

export class ControlChannels {
  @Expose({ name: 'iot' })
  iot: boolean = true;

  @Expose({ name: 'ble' })
  ble: boolean = false;
}

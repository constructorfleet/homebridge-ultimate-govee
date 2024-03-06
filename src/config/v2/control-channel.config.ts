import { Expose, Transform } from 'class-transformer';
import { BehaviorSubject } from 'rxjs';

export class ControlChannels {
  @Expose({ name: 'iot' })
  @Transform(({ value }) => new BehaviorSubject(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  iot: BehaviorSubject<boolean> = new BehaviorSubject(false);

  @Expose({ name: 'ble' })
  @Transform(({ value }) => new BehaviorSubject(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  ble: BehaviorSubject<boolean> = new BehaviorSubject(false);
}

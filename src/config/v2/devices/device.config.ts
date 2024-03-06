import { Expose, Transform } from 'class-transformer';
import { BehaviorSubject } from 'rxjs';

export class DeviceConfig {
  constructor() {
    this.ignore = new BehaviorSubject(false);
  }
  @Expose({ name: '_type' })
  type: string = 'device';

  @Expose({ name: 'id' })
  id!: string;

  @Expose({ name: 'name' })
  name?: string;

  @Expose({ name: 'ignore' })
  @Transform(({ value }) => new BehaviorSubject(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  ignore: BehaviorSubject<boolean>;
}

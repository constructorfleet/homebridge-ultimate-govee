import { Expose } from 'class-transformer';

export class DeviceConfig {
  @Expose({ name: '_type' })
  type: string = 'device';

  @Expose({ name: 'id' })
  id!: string;

  @Expose({ name: 'name' })
  name?: string;

  @Expose({ name: 'debug' })
  debug: boolean = false;

  @Expose({ name: 'ignore' })
  ignore: boolean = false;

  @Expose({ name: 'exposePrevious' })
  exposePrevious: boolean = false;
}

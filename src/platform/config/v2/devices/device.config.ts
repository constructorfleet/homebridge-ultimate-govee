import { Expose } from 'class-transformer';

export class DeviceConfig {
  @Expose({ name: '_type' })
  type!: string;

  @Expose({ name: 'id' })
  id!: string;

  @Expose({ name: 'name' })
  name?: string;

  @Expose({ name: 'ignore' })
  ignore: boolean = false;
}

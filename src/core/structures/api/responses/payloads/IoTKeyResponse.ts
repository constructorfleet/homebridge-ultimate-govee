import { BaseResponse } from './BaseResponse';
import { Expose, Transform, Type } from 'class-transformer';

export class IoTData {
    @Expose({ name: 'endpoint' })
    public endpoint!: string;

    @Expose({ name: 'p12' })
    public p12!: string;

    @Expose({ name: 'p12Pass' })
    public p12Pass!: string;
}

export class IoTKeyResponse
  extends BaseResponse {
    @Expose({ name: 'data' })
    @Type(() => IoTData)
    public data!: IoTData;
}
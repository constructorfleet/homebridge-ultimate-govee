import {ObjectType} from '@nestjs/graphql';
import {Device} from '../interfaces';

@ObjectType(
  'GoveeDevice',
  {
    description: 'Base Govee device implementation',
    implements: () => [Device],
  },
)
export class GoveeDevice implements Device {
    bleAddress?: string;
    createdAt!: Date;
    deviceId!: string;
    goodsType!: number;
    hardwareVersion?: string;
    id!: string;
    iotTopic?: string;
    macAddress!: string;
    model!: string;
    name!: string;
    pactCode!: number;
    pactType!: number;
    softwareVersion?: string;
    updatedAt!: Date;
}
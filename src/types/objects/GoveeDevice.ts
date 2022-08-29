import {Field, ObjectType} from '@nestjs/graphql';
import {Device, State} from '../interfaces';

@ObjectType(
  'GoveeDevice',
  {
    description: 'Base Govee device implementation',
    implements: () => [Device],
  },
)
export class GoveeDevice implements Device {
    @Field(
      () => [State],
      {
        name: 'states',
        description: 'States associated with this device',
      },
    )
    states!: State[];

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
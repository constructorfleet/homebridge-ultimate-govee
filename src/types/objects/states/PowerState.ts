import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';

@ObjectType(
  'PowerState',
  {
    description: 'The power state for a device',
    implements: () => [State],
  },
)
export class PowerState implements State {
    @Field(
      {
        name: 'isOn',
        description: 'Flag indicating the device is on',
      },
    )
    isOn!: boolean;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
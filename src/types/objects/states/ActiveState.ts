import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';

@ObjectType(
  'ActiveState',
  {
    description: 'The active state for a device',
    implements: () => [State],
  },
)
export class ActiveState implements State {
    @Field(
      {
        name: 'isActive',
        description: 'Flag indicating the device is active',
      },
    )
    isActive!: boolean;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
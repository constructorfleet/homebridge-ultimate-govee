import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';

@ObjectType(
  'ConnectedState',
  {
    description: 'The connection state for a device',
    implements: () => [State],
  },
)
export class ConnectedState implements State {
    @Field(
      {
        name: 'isConnected',
        description: 'Flag indicating the device is connected',
      },
    )
    isConnected!: boolean;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
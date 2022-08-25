import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';
import {MistLevel} from '../../scalars';

@ObjectType(
  'MistLevelState',
  {
    description: 'The current mist level state for a device',
    implements: () => [State],
  },
)
export class MistLevelState implements State {
    @Field(
      () => MistLevel,
      {
        name: 'mistLevel',
        description: 'The current mist level number for the device',
      },
    )
    mistLevel!: number;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
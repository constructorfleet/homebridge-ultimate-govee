import {Field, ObjectType} from '@nestjs/graphql';
import {MistLevel, ProgramId} from '../scalars';
import {Duration} from '../scalars/Duration';

@ObjectType(
  'MistLevelProgram',
  {
    description: 'Mist program definition',
  },
)
export class MistLevelProgram {
    @Field(
      () => ProgramId,
      {
        name: 'id',
        description: 'The program identifier',
      },
    )
    id!: number;

    @Field(
      () => MistLevel,
      {
        name: 'mistLevel',
        description: 'The mist level number for this program',
      },
    )
    mistLevel!: number;

    @Field(
      () => Duration,
      {
        name: 'duration',
        description: 'The duration of the program in seconds',
      },
    )
    duration!: number;

    @Field(
      () => Duration,
      {
        name: 'remaining',
        description: 'The remaining duration of the program in seconds',
      },
    )
    remaining!: number;
}
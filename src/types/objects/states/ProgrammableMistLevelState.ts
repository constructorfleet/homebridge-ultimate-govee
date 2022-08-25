import {State} from '../../interfaces';
import {Field, ObjectType} from '@nestjs/graphql';
import {ProgramId} from '../../scalars';
import {MistLevelProgram} from '../MistLevelProgram';

@ObjectType(
  'ProgrammableMistLevelState',
  {
    description: 'The mist level programs for this device',
    implements: () => [State],
  },
)
export class ProgrammableMistLevelState implements State {
    @Field(
      () => ProgramId,
      {
        name: 'mistLevelProgramId',
        nullable: true,
        description: 'The current mist level program identifier',
      },
    )
    mistLevelProgramId?: number;

    @Field(
      () => [MistLevelProgram],
      {
        name: 'mistLevelPrograms',
        description: 'The available mist level programs for this device',
      },
    )
    mistLevelPrograms!: [MistLevelProgram];

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
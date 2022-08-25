import {State} from './State';
import {Field, InterfaceType} from '@nestjs/graphql';
import {ProgramId} from '../../scalars';
import {MistLevelProgram} from '../../objects/MistLevelProgram';

@InterfaceType(
  'ProgrammableMistLevelState',
  {
    description: 'The mist level programs for this device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class ProgrammableMistLevelState implements State {
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
}
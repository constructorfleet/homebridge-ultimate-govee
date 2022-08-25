import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';
import {MistLevel} from '../../scalars';

@InterfaceType(
  'MistLevelState',
  {
    description: 'The current mist level state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class MistLevelState implements State {
    @Field(
      () => MistLevel,
      {
        name: 'mistLevel',
        description: 'The current mist level number for the device',
      },
    )
    mistLevel!: number;
}
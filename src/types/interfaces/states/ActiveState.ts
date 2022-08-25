import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';

@InterfaceType(
  'ActiveState',
  {
    description: 'The active state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class ActiveState implements State {
    @Field(
      {
        name: 'isActive',
        description: 'Flag indicating the device is active',
      },
    )
    isActive!: boolean;
}
import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';

@InterfaceType(
  'ConnectedState',
  {
    description: 'The connection state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class ConnectedState implements State {
    @Field(
      {
        name: 'isConnected',
        description: 'Flag indicating the device is connected',
      },
    )
    isConnected!: boolean;
}
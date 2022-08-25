import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';
import {Status} from '../../scalars';

@InterfaceType(
  'StatusState',
  {
    description: 'The current device status',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class StatusState implements State {
    @Field(
      () => Status,
      {
        name: 'statusCode',
        description: 'The current device status code',
      },
    )
    statusCode!: number;

    @Field(
      () => Status,
      {
        name: 'subStatusCode',
        description: 'The current device sub-status code',
      },
    )
    subStatusCode!: number;
}
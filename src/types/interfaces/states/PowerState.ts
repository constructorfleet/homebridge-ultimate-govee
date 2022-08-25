import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';

@InterfaceType(
  'PowerState',
  {
    description: 'The power state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class PowerState implements State {
    @Field(
      {
        name: 'isOn',
        description: 'Flag indicating the device is on',
      },
    )
    isOn!: boolean;
}
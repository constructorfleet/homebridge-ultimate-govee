import {InterfaceType} from '@nestjs/graphql';

@InterfaceType(
  'State',
  {
    description: 'Interface for device state',
    isAbstract: true,
  },
)
export abstract class State {

}
import {InterfaceType} from '@nestjs/graphql';
import {Node} from '../Node';
import {StateMap} from './index';

@InterfaceType(
  'State',
  {
    description: 'Interface for device state',
    isAbstract: true,
    implements: () => [Node],
    resolveType: (source) => StateMap[source.getType().name],
  },
)
export abstract class State implements Node {
    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
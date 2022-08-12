import {Field, InterfaceType} from '@nestjs/graphql';
import {DateTime} from '../externals';
import {NodeId} from '../scalars';

@InterfaceType(
  'Node',
  {
    description: 'Interface defining fields common to all Node objects',
    isAbstract: true,
  },
)
export class Node {
  @Field(
    () => NodeId,
    {
      name: 'id',
      description: 'The identifier of the node',
    },
  )
  id!: string;

  @Field(
    () => DateTime,
    {
      name: 'createdAt',
      description: 'When the node was created',
    },
  )
  createdAt!: Date;

  @Field(
    () => DateTime,
    {
      name: 'updatedAt',
      description: 'When the node was last updated',
    },
  )
  updatedAt!: Date;
}

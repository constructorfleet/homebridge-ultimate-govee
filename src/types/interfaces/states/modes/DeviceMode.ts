import {Field, InterfaceType} from '@nestjs/graphql';
import {ModeId} from '../../../scalars';
import {Node} from '../../Node';
import {ModeMap} from '../../../objects';

@InterfaceType(
  'DeviceMode',
  {
    description: 'Definition of a device mode',
    isAbstract: true,
    implements: () => [Node],
    resolveType: (source) => ModeMap[source.getType().name],
  },
)
export abstract class DeviceMode implements Node {
    @Field(
      () => ModeId,
      {
        name: 'modeId',
        description: 'The identifier of this device mode',
      },
    )
    modeId!: number;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
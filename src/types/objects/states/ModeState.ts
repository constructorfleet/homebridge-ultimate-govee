import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';
import {ModeId} from '../../scalars';
import {DeviceMode} from '../../interfaces';

@ObjectType(
  'ModeState',
  {
    description: 'The mode state for a device',
    implements: () => [State],
  },
)
export class ModeState implements State {
    @Field(
      () => ModeId,
      {
        name: 'activeModeId',
        description: 'Identifier of the active device mode',
      },
    )
    activeModeId!: number;

    @Field(
      () => [DeviceMode],
      {
        name: 'modes',
        description: 'List of possible device modes',
      },
    )
    modes!: [DeviceMode];

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
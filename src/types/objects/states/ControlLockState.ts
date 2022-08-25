import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';

@ObjectType(
  'ControlLockState',
  {
    description: 'The control lock state for a device',
    implements: () => [State],
  },
)
export class ControlLockState implements State {
    @Field(
      {
        name: 'areControlsLocked',
        description: 'Flag indicating the device controls are locked',
      },
    )
    areControlsLocked!: boolean;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';

@InterfaceType(
  'ControlLockState',
  {
    description: 'The control lock state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class ControlLockState implements State {
    @Field(
      {
        name: 'areControlsLocked',
        description: 'Flag indicating the device controls are locked',
      },
    )
    areControlsLocked!: boolean;
}
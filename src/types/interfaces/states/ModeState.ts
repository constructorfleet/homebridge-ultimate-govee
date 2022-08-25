import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';
import {ModeId} from '../../scalars';
import {DeviceMode} from './modes';

@InterfaceType(
  'ModeState',
  {
    description: 'The mode state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class ModeState implements State {
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
}
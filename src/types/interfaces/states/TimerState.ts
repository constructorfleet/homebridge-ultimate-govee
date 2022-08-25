import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';
import {Duration} from '../../scalars/Duration';

@InterfaceType(
  'TimerState',
  {
    description: 'The timer state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class TimerState implements State {
    @Field(
      {
        name: 'isTimerOn',
        description: 'Flag indicating the device timer is active',
      },
    )
    isTimerOn!: boolean;

    @Field(
      () => Duration,
      {
        name: 'timerDuration',
        description: 'The duration of the device timer in seconds',
      },
    )
    timerDuration!: number;
}
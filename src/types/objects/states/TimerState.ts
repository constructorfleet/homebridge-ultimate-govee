import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';
import {Duration} from '../../scalars/Duration';

@ObjectType(
  'TimerState',
  {
    description: 'The timer state for a device',
    implements: () => [State],
  },
)
export class TimerState implements State {
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

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
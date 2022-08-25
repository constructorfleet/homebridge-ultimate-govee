import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';
import {Brightness} from '../../scalars';

@ObjectType(
  'BrightnessState',
  {
    description: 'The brightness state for a device',
    implements: () => [State],
  },
)
export class BrightnessState implements State {
    @Field(
      () => Brightness,
      {
        name: 'brightness',
        description: 'The brightness level of the device 0 - 100%',
      },
    )
    brightness!: number;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';
import {Brightness} from '../../scalars';

@InterfaceType(
  'BrightnessState',
  {
    description: 'The brightness state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class BrightnessState implements State {
    @Field(
      () => Brightness,
      {
        name: 'brightness',
        description: 'The brightness level of the device 0 - 100%',
      },
    )
    brightness!: number;
}
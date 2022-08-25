import {Field, ObjectType} from '@nestjs/graphql';
import {State} from '../../interfaces';
import {RGBColor} from '../index';

@ObjectType(
  'SolidColorState',
  {
    description: 'The current solid color state for a device',
    implements: () => [State],
  },
)
export class SolidColorState implements State {
    @Field(
      () => RGBColor,
      {
        name: 'solidColor',
        description: 'The solid RGB color',
      },
    )
    solidColor!: RGBColor;

    createdAt!: Date;
    id!: string;
    updatedAt!: Date;
}
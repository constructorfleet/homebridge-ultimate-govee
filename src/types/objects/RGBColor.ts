import {Field, ObjectType} from '@nestjs/graphql';
import {ColorComponent} from '../scalars';

@ObjectType(
  'RGBColor',
  {
    description: 'Color in red, green, blue components',
  },
)
export class RGBColor {
    @Field(
      () => ColorComponent,
      {
        name: 'Red',
        description: 'The red component for this color.',
      },
    )
    red!: number;

    @Field(
      () => ColorComponent,
      {
        name: 'Green',
        description: 'The green component for this color.',
      },
    )
    green!: number;

    @Field(
      () => ColorComponent,
      {
        name: 'Blue',
        description: 'The blue component for this color.',
      },
    )
    blue!: number;
}
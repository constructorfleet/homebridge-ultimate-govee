import {Field, InterfaceType} from '@nestjs/graphql';
import {State} from './State';
import {RGBColor} from "../../objects";

@InterfaceType(
  'SolidColorState',
  {
    description: 'The current solid color state for a device',
    implements: () => [State],
    isAbstract: true,
  },
)
export abstract class SolidColorState implements State {
    @Field(
      () => RGBColor,
      {
        name: 'solidColor',
        description: 'The solid RGB color',
      },
    )
    solidColor!: RGBColor;
}
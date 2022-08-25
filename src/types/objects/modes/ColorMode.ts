import {Field, ObjectType} from '@nestjs/graphql';
import {DeviceMode} from '../../interfaces';
import {RGBColor} from '../RGBColor';

@ObjectType(
  'ColorMode',
  {
    description: 'RGB color mode',
    implements: () => [DeviceMode],
  },
)
export class ColorMode implements DeviceMode {
    @Field(
      () => RGBColor,
      {
        name: 'color',
        description: 'Active RGB color for this device mode',
      },
    )
    color!: RGBColor;

    id!: number;
}
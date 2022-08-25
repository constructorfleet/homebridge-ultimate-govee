import {ConstrainedNumber} from './ConstrainedNumber';

export const ColorComponent = ConstrainedNumber(
    'ColorComponent',
    'The color value from 0-255',
    {
        min: 0,
        max: 255,
        clamp: true,
    },
);
import {ConstrainedNumber} from './ConstrainedNumber';

export const ModeId = ConstrainedNumber(
    'ModeId',
    'The identifier of a mode',
    {
        min: 0,
        max: 255,
        clamp: true,
    },
);
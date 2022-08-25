import {ConstrainedNumber} from './ConstrainedNumber';

export const ProgramId = ConstrainedNumber(
    'ProgramId',
    'The identifier of a program',
    {
        min: 0,
        max: 255,
        clamp: true,
    },
);
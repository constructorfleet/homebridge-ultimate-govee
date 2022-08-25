import {ConstrainedNumber} from '../ConstrainedNumber';

export const PactCode = ConstrainedNumber(
    'PactCode',
    'The device pact code',
    {
        min: 0,
    },
);
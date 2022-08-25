import {ConstrainedNumber} from '../ConstrainedNumber';

export const GoodsType = ConstrainedNumber(
    'GoodsType',
    'The goods type identifier',
    {
        min: 0,
    },
);
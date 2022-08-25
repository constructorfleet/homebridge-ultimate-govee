import {ConstrainedNumber} from './ConstrainedNumber';

export const Status = ConstrainedNumber(
  'Status',
  'The status code',
  {
    min: 0,
    max: 255,
    clamp: true,
  },
);
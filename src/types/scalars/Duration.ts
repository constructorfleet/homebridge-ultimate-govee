import {ConstrainedNumber} from './ConstrainedNumber';


export const Duration = ConstrainedNumber(
  'Duration',
  'Duration in seconds',
  {
    min: 0,
    max: 255,
    clamp: true,
  },
);
import {ConstrainedNumber} from '../../ConstrainedNumber';

export const MistLevel = ConstrainedNumber(
  'MistLevel',
  'The mist level number',
  {
    min: 0,
    max: 8,
    clamp: true,
  },
);
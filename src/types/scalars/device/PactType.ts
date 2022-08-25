import {ConstrainedNumber} from '../ConstrainedNumber';

export const PactType = ConstrainedNumber(
  'PactType',
  'The device pact type identifier',
  {
    min: 0,
  },
);
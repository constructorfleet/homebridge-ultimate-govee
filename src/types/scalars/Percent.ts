import {ConstrainedNumber} from './ConstrainedNumber';
import {GraphQLScalarType} from 'graphql/index';

export const createPercentScalar = (
  name: string,
  description: string,
  clamp = true,
): GraphQLScalarType => ConstrainedNumber(
  name,
  description,
  {
    min: 0,
    max: 100,
    clamp: clamp,
  },
);

export const Percent = createPercentScalar(
  'Percent',
  'An integer value between 0% and 100%',
);
import {GraphQLError, GraphQLScalarType, Kind} from 'graphql';
import {isNumber} from '@nestjs/common/utils/shared.utils';

export const PactType = new GraphQLScalarType({
  name: 'PactType',
  description: 'The PactType associated with this device.',
  serialize(value) {
    if (!isNumber(value)) {
      throw new TypeError(`Expected a numeric value for PactType, got ${value}`);
    }

    return value;
  },
  parseValue(value) {
    if (!isNumber(value)) {
      throw new TypeError(`Expected a numeric value for PactType, got ${value}`);
    }

    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Expected an integer PactType value, got ${ast.kind}`,
      );
    }

    return parseInt(ast.value);
  },
  extensions: {
    codegenScalarType: 'number',
  },
});
